<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BonusAuditListItem } from '#/types/bonus-audit';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  disposeBonusAuditApi,
  fetchBonusAuditListApi,
} from '#/api/operationManage/bonus-audit';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  formatBonusApprove,
  formatBonusWaterRequirement,
  formatBonusWaterType,
  getBonusApproveColor,
} from '#/utils/bonus-audit';
import {
  BONUS_EVENT_APPROVE_STATUS_OPTIONS,
  BONUS_EVENT_RISK_STATUS_OPTIONS,
  VIP_LEVEL_OPTIONS,
} from '#/utils/bonus-reward';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  PLAYER_STATUS_OPTIONS,
  formatPlayerStatus,
} from '#/utils/player-status';

import BonusAuditActionModal from './bonus-audit-action-modal.vue';

defineOptions({ name: 'BonusEventAudit' });

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

const canViewTable = computed(() => checkPermission(11969));
const canApprove = computed(() => checkPermission(11971));
const canReject = computed(() => checkPermission(11972));
const canBatchApprove = computed(() => checkPermission(11973));
const canBatchReject = computed(() => checkPermission(11976));
const canExport = computed(() => checkPermission(11970));

const selectedRows = ref<BonusAuditListItem[]>([]);
const rejectOpen = ref(false);
const rejectRow = ref<BonusAuditListItem | null>(null);
const exportLoading = ref(false);
const totalAmount = ref(0);

const summaryItems = computed(() => [
  {
    label: '金额总计',
    value: formatAmountFromCent(totalAmount.value),
    valueClass: 'font-medium text-gray-900',
  },
]);

const filterLoginAccount = ref('');
const filterPackageName = ref('');
const filterTitle = ref('');
const filterPageTitle = ref('');
const filterOrderId = ref('');
const filterPageType = ref(-1);
const filterChannelIds = ref<Array<number | string>>([]);
const filterPlayerStatus = ref(-1);
const filterVipLevel = ref(-1);
const filterApproveStatus = ref(1);
const filterRiskStatus = ref('');
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
const filterApproveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

const playerStatusOptions = [
  { label: '全部', value: -1 },
  ...PLAYER_STATUS_OPTIONS,
];

const pageTypeOptions = [
  { label: '全部', value: -1 },
  { label: '新账号奖励', value: 1 },
  { label: '首存体验', value: 2 },
  { label: '签到礼包', value: 3 },
  { label: '复活礼包', value: 4 },
];

const pageTypeMap = Object.fromEntries(
  pageTypeOptions
    .filter((item) => item.value !== -1)
    .map((item) => [item.value, item.label]),
);

function formatEventPageType(pageType?: number | string) {
  if (pageType === undefined || pageType === null || pageType === '') {
    return '-';
  }
  return pageTypeMap[Number(pageType)] || String(pageType);
}

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function getAdminId() {
  const admin = cloudStore.adminInfo?.Admin as
    | Record<string, unknown>
    | undefined;
  return admin?.Id;
}

function canSelectRow(row: BonusAuditListItem) {
  return (
    Number(row.Approve) === 1 &&
    String(row.CreateAdminId ?? '') !== String(getAdminId() ?? '')
  );
}

function canOperateRow(row: BonusAuditListItem) {
  return (
    Number(row.Approve) !== 1 ||
    String(row.CreateAdminId ?? '') === String(getAdminId() ?? '')
  );
}

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams() {
  const [applyBegin, applyEnd] = filterApplyDateRange.value || [];
  const [approveBegin, approveEnd] = filterApproveDateRange.value || [];
  return {
    ActivityType: 10009,
    ApplyBeginTime: applyBegin ? applyBegin.startOf('day').unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.endOf('day').unix() : '',
    ApproveBeginTime: approveBegin ? approveBegin.startOf('day').unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.endOf('day').unix() : '',
    ApproveStatus: filterApproveStatus.value,
    ChannelIds: filterChannelIds.value,
    IsExp: false,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    PackageName: filterPackageName.value.trim(),
    PageTitle: filterPageTitle.value.trim(),
    PageType: filterPageType.value,
    PlayerStatus: filterPlayerStatus.value,
    RiskStatus: filterRiskStatus.value,
    Title: filterTitle.value.trim(),
    VipLevel: filterVipLevel.value,
  };
}

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);
const hasSelection = computed(() => selectedRows.value.length > 0);

const gridOptions: VxeTableGridOptions<BonusAuditListItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canSelectRow(row as BonusAuditListItem),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '订单状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'PlayerStatus',
      formatter: ({ cellValue }) => formatPlayerStatus(cellValue),
      minWidth: 90,
      title: '玩家状态',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'PackageName', minWidth: 120, title: '产品名称' },
    {
      field: 'ChannelName',
      formatter: ({ row }) =>
        `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
      minWidth: 150,
      title: '所属渠道',
    },
    {
      field: 'Title',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '红利标题',
    },
    {
      field: 'PageType',
      formatter: ({ cellValue }) => formatEventPageType(cellValue),
      minWidth: 100,
      title: '活动分类',
    },
    { field: 'PageTitle', minWidth: 120, title: '活动分页' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '红利金额',
    },
    {
      field: 'WaterType',
      formatter: ({ cellValue }) => formatBonusWaterType(cellValue),
      minWidth: 110,
      title: '流水类型',
    },
    {
      field: 'Water',
      formatter: ({ row }) => formatBonusWaterRequirement(row),
      minWidth: 100,
      title: '流水要求',
    },
    {
      field: 'HandleDesc',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '风控信息',
    },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    { field: 'ApproveName', minWidth: 110, title: '审核人' },
    {
      field: 'ApproveRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchBonusAuditListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        totalAmount.value = Number(result?.Total?.Total || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: BonusAuditListItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: BonusAuditListItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function approveRows(ids: string, accounts: string) {
  Modal.confirm({
    content: `确认通过以下账号的活动红利申请？${accounts}`,
    title: '通过审核',
    onOk: async () => {
      await disposeBonusAuditApi({
        Approve: 2,
        HandleDesc: '',
        Ids: ids,
      });
      message.success('审核通过');
      selectedRows.value = [];
      gridApi.reload();
    },
  });
}

function handleApprove(row: BonusAuditListItem) {
  if (!row.Id) {
    return;
  }
  void approveRows(String(row.Id), String(row.LoginAccount || ''));
}

function handleBatchApprove() {
  if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  }
  const accounts = selectedRows.value
    .map((row) => row.LoginAccount)
    .filter(Boolean)
    .join(',');
  void approveRows(selectedIds.value, accounts);
}

function openReject(row?: BonusAuditListItem) {
  if (row) {
    rejectRow.value = row;
  } else if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  } else {
    rejectRow.value = null;
  }
  rejectOpen.value = true;
}

function resetFilters() {
  filterLoginAccount.value = '';
  filterPackageName.value = '';
  filterTitle.value = '';
  filterPageTitle.value = '';
  filterOrderId.value = '';
  filterPageType.value = -1;
  filterChannelIds.value = [];
  filterPlayerStatus.value = -1;
  filterVipLevel.value = -1;
  filterApproveStatus.value = 1;
  filterRiskStatus.value = '';
  filterApplyDateRange.value = null;
  filterApproveDateRange.value = null;
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchBonusAuditListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10000,
    });
    const rows = result?.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        {
          header: '订单状态',
          value: (row) => formatBonusApprove(row.Approve),
        },
        {
          header: '申请时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        { header: '订单号', value: (row) => row.OrderId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        {
          header: '玩家状态',
          value: (row) => formatPlayerStatus(row.PlayerStatus),
        },
        {
          header: 'VIP等级',
          value: (row) =>
            row.VipLevel === undefined || row.VipLevel === null
              ? '-'
              : `VIP${row.VipLevel}`,
        },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        {
          header: '所属渠道',
          value: (row) => `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
        },
        { header: '红利标题', value: (row) => row.Title || '-' },
        {
          header: '活动分类',
          value: (row) => formatEventPageType(row.PageType),
        },
        { header: '活动分页', value: (row) => row.PageTitle || '-' },
        {
          header: '红利金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        {
          header: '流水类型',
          value: (row) => formatBonusWaterType(row.WaterType),
        },
        {
          header: '流水要求',
          value: (row) => formatBonusWaterRequirement(row),
        },
        { header: '风控信息', value: (row) => row.HandleDesc || '-' },
        {
          header: '审核时间',
          value: (row) => formatDateTime(row.ApproveTime),
        },
        { header: '审核人', value: (row) => row.ApproveName || '-' },
        { header: '审核备注', value: (row) => row.ApproveRemark || '-' },
      ],
      `活动红利审核_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 200px"
        @change="normalizeLoginAccount"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Input
        v-model:value="filterPackageName"
        allow-clear
        placeholder="产品名称"
        style="width: 180px"
      >
        <template #addonBefore>产品名称</template>
      </Input>
      <Input
        v-model:value="filterTitle"
        allow-clear
        placeholder="红利标题"
        style="width: 180px"
      >
        <template #addonBefore>红利标题</template>
      </Input>
      <Select
        v-model:value="filterPageType"
        :options="pageTypeOptions"
        style="width: 120px"
      />
      <Input
        v-model:value="filterPageTitle"
        allow-clear
        placeholder="活动分页"
        style="width: 180px"
      >
        <template #addonBefore>活动分页</template>
      </Input>
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单号"
        style="width: 200px"
      >
        <template #addonBefore>订单号</template>
      </Input>
      <ChannelSelect v-model="filterChannelIds" style="width: 220px" />
      <Select
        v-model:value="filterPlayerStatus"
        :options="playerStatusOptions"
        style="width: 120px"
      />
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
        style="width: 100px"
      />
      <Select
        v-model:value="filterApproveStatus"
        :options="BONUS_EVENT_APPROVE_STATUS_OPTIONS"
        style="width: 120px"
      />
      <Select
        v-model:value="filterRiskStatus"
        :options="BONUS_EVENT_RISK_STATUS_OPTIONS"
        style="width: 120px"
      />
      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">申请时间</span>
        <DatePicker.RangePicker
          v-model:value="filterApplyDateRange"
          show-time
        />
      </div>
      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">审核时间</span>
        <DatePicker.RangePicker
          v-model:value="filterApproveDateRange"
          show-time
        />
      </div>
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出 CSV
      </Button>
    </div>

    <div
      v-if="canBatchApprove || canBatchReject"
      class="mb-3 flex flex-wrap gap-2"
    >
      <Button
        v-if="canBatchApprove"
        :disabled="!hasSelection"
        type="primary"
        @click="handleBatchApprove"
      >
        批量通过
      </Button>
      <Button
        v-if="canBatchReject"
        :disabled="!hasSelection"
        danger
        @click="openReject()"
      >
        批量拒绝
      </Button>
    </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #approve="{ row }">
        <Tag :color="getBonusApproveColor(row.Approve)">
          {{ formatBonusApprove(row.Approve) }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #actions="{ row }">
        <Space v-if="!canOperateRow(row)" :size="0" wrap>
          <Button
            v-if="canApprove"
            size="small"
            type="link"
            @click="handleApprove(row)"
          >
            通过
          </Button>
          <Button
            v-if="canReject"
            danger
            size="small"
            type="link"
            @click="openReject(row)"
          >
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>

    <BonusAuditActionModal
      v-model:open="rejectOpen"
      :row="rejectRow"
      :selected-ids="selectedIds"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11969 才能查看活动红利审核"
    title="无权限"
  />
</template>
