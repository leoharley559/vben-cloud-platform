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
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  formatBonusApprove,
  formatBonusReason,
  formatBonusWaterRequirement,
  formatBonusWaterType,
  getBonusApproveColor,
} from '#/utils/bonus-audit';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

import BonusAuditActionModal from './bonus-audit-action-modal.vue';

defineOptions({ name: 'BonusReleaseAudit' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const cloudStore = useCloudPlatformStore();

const canViewTable = computed(() => checkPermission(10117));
const canApprove = computed(() => checkPermission(10119));
const canReject = computed(() => checkPermission(10120));
const canBatchApprove = computed(() => checkPermission(10160));
const canBatchReject = computed(() => checkPermission(10161));
const canExport = computed(() => checkPermission(10118));

const defaultRange = getYesterdayRangeSeconds();
const selectedRows = ref<BonusAuditListItem[]>([]);
const rejectOpen = ref(false);
const rejectRow = ref<BonusAuditListItem | null>(null);
const exportLoading = ref(false);
const totalAmount = ref(0);
const totalRealAmount = ref(0);

const summaryItems = computed(() => [
  {
    label: '申请金额总计',
    value: formatAmountFromCent(totalAmount.value),
    valueClass: 'font-medium text-gray-900',
  },
  {
    label: '实发金额总计',
    value: formatAmountFromCent(totalRealAmount.value),
    valueClass: 'font-medium text-gray-900',
  },
]);

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterWaterType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

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

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    Approve: '1,4',
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    ChannelIds: filterChannelIds.value,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    IsExp: false,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    WaterType: filterWaterType.value,
  };
}

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);

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
      title: '审核状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'Title',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '红利标题',
    },
    {
      field: 'Reason',
      formatter: ({ cellValue }) => formatBonusReason(cellValue),
      minWidth: 110,
      title: '类型',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'ChannelName',
      formatter: ({ row }) =>
        `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
      minWidth: 150,
      title: '所属渠道',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '申请金额',
    },
    {
      field: 'RealApplyAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '实发金额',
    },
    {
      field: 'WaterType',
      formatter: ({ cellValue }) => formatBonusWaterType(cellValue),
      minWidth: 110,
      title: '流水要求类型',
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
      title: '申请备注',
    },
    { field: 'HandlerName', minWidth: 110, title: '申请人' },
    { field: 'ApproveName', minWidth: 110, title: '审核人' },
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
        totalRealAmount.value = Number(result?.Total?.TotalReal || 0);
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
const hasSelection = computed(() => selectedRows.value.length > 0);

function approveRows(ids: string, accounts: string) {
  Modal.confirm({
    content: `确认通过以下账号的红利申请？${accounts}`,
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
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterWaterType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
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
          header: '审核状态',
          value: (row) => formatBonusApprove(row.Approve),
        },
        {
          header: '申请时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        { header: '红利标题', value: (row) => row.Title || '-' },
        {
          header: '类型',
          value: (row) => formatBonusReason(row.Reason),
        },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        {
          header: '申请金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        {
          header: '实发金额',
          value: (row) => formatAmountFromCent(row.RealApplyAmount),
        },
        { header: '申请人', value: (row) => row.HandlerName || '-' },
        { header: '审核人', value: (row) => row.ApproveName || '-' },
      ],
      `红利发放审核_${dayjs().format('YYYYMMDDHHmmss')}`,
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
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 220px"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 200px"
        @change="normalizeLoginAccount"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Select
        v-model:value="filterPackageId"
        allow-clear
        :options="packageSelectOptions"
        placeholder="产品名称"
        style="width: 160px"
        show-search
        :filter-option="
          (input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
        "
      />
      <ChannelSelect v-model="filterChannelIds" style="width: 220px" />
      <Select
        v-model:value="filterWaterType"
        :options="[
          { label: '全部', value: 0 },
          { label: '倍数', value: 1 },
          { label: '金额', value: 2 },
        ]"
        style="width: 120px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出 CSV
      </Button>
    </div>

    <SummaryCards :items="summaryItems" />

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
    sub-title="需要权限 10117 才能查看红利发放审核"
    title="无权限"
  />
</template>
