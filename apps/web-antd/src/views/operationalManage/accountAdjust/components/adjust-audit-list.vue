<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerAdjustListItem } from '#/types/player-detail';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
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
  disposeAccountAdjustAuditApi,
  fetchPlayerAdjustListApi,
} from '#/api/operationManage/account-adjust';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  ADJUST_AUDIT_HANDLE_TYPE_OPTIONS,
  ADJUST_AUDIT_WATER_TYPE_OPTIONS,
  ADJUST_REASON_OPTIONS,
  formatAdjustApprove,
  formatAdjustHandleType,
  formatAdjustReason,
  formatAdjustWater,
  formatAdjustWaterType,
  getAdjustApproveColor,
} from '#/utils/account-adjust';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { getLast3CalendarDaysRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { ACCOUNT_ADJUST_AUDIT_PAGE_ID } from '#/utils/security-page-ids';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import AdjustAuditActionModal from './adjust-audit-action-modal.vue';

defineOptions({ name: 'AdjustAuditList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10099));
const canApprove = computed(() => checkPermission(10101));
const canReject = computed(() => checkPermission(10102));
const canBatchApprove = computed(() => checkPermission(10103));
const canBatchReject = computed(() => checkPermission(10104));
const canExport = computed(() => checkPermission(10105));

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const pendingApprove = ref<{ accounts: string; ids: string } | null>(null);

const defaultRange = getLast3CalendarDaysRangeSeconds();
const selectedRows = ref<PlayerAdjustListItem[]>([]);
const rejectOpen = ref(false);
const rejectRow = ref<PlayerAdjustListItem | null>(null);
const totalAmount = ref(0);
const exportLoading = ref(false);

const summaryItems = computed(() => [
  {
    label: '调整合计',
    value: formatAmountFromCent(totalAmount.value),
  },
]);

const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPlayerName = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterAdminUserName = ref('');
const filterReason = ref<number>(-1);
const filterOrderId = ref('');
const filterHandleType = ref<number | string>('');
const filterWaterType = ref<number | string>('');
const filterCreateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
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

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterCreateRange.value || [];
  return {
    AdminUserName: filterAdminUserName.value.trim(),
    Approve: '1,4',
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: channelIdsParam(),
    EndTime: end ? end.unix() : '',
    HandleType: filterHandleType.value,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    PlayerId: filterPlayerId.value.trim(),
    PlayerName: filterPlayerName.value.trim(),
    Reason: filterReason.value,
    WaterType: filterWaterType.value,
  };
}

function formatChannel(row: PlayerAdjustListItem) {
  if (row.ChannelName || row.ChannelId) {
    return `${row.ChannelName || '-'}${row.ChannelId ? `(${row.ChannelId})` : ''}`;
  }
  return '-';
}

function canSelectRow(row: PlayerAdjustListItem) {
  return (
    Number(row.Approve) === 1 &&
    !isSameAcctActionRestricted(
      ACCOUNT_ADJUST_AUDIT_PAGE_ID,
      row.CreateAdminId as number | string | undefined,
    )
  );
}

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);

const gridOptions: VxeTableGridOptions<PlayerAdjustListItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canSelectRow(row as PlayerAdjustListItem),
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
      title: '创建时间',
    },
    {
      field: 'Reason',
      formatter: ({ cellValue }) => formatAdjustReason(cellValue),
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
      field: 'HandleType',
      formatter: ({ cellValue }) => formatAdjustHandleType(cellValue),
      minWidth: 90,
      title: '调整方式',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'PlayerId',
      minWidth: 100,
      title: '玩家ID',
    },
    {
      field: 'PlayerName',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 100,
      title: '玩家昵称',
    },
    {
      field: 'AdminUserName',
      minWidth: 110,
      slots: { default: 'adminUserName' },
      title: '代理账号',
    },
    {
      field: 'PackageName',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 100,
      title: '产品名称',
    },
    {
      field: 'ChannelName',
      formatter: ({ row }) => formatChannel(row),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '所属渠道',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '调整金额',
    },
    {
      field: 'HandleDesc',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'WaterType',
      formatter: ({ row }) =>
        formatAdjustWaterType(row.HandleType, row.WaterType),
      minWidth: 120,
      title: '流水类型',
    },
    {
      field: 'Water',
      formatter: ({ row }) => formatAdjustWater(row),
      minWidth: 100,
      title: '调整流水',
    },
    { field: 'HandlerName', minWidth: 110, title: '申请账号' },
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
        const result = await fetchPlayerAdjustListApi(getQueryParams(page));
        totalAmount.value = Number(result?.Total?.Total || 0);
        selectedRows.value = [];
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '',
      '合计',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      formatAmountFromCent(totalAmount.value),
      '-',
      '-',
      '-',
      '-',
      '',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: PlayerAdjustListItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: PlayerAdjustListItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function approveRows(ids: string, accounts: string) {
  Modal.confirm({
    content: `确认通过以下账号的调整申请？${accounts}`,
    title: '通过审核',
    onOk: () => {
      pendingApprove.value = { accounts, ids };
      passPopupRef.value?.validate(ACCOUNT_ADJUST_AUDIT_PAGE_ID);
    },
  });
}

async function handleApprovePassConfirm(data: Record<string, unknown>) {
  if (!pendingApprove.value?.ids) {
    return;
  }
  try {
    await disposeAccountAdjustAuditApi({
      Approve: 2,
      ApproveRemark: '',
      Ids: pendingApprove.value.ids,
      ValidCode: data.ValidCode || '',
    });
    message.success('审核通过');
    selectedRows.value = [];
    gridApi.reload();
  } finally {
    pendingApprove.value = null;
  }
}

function handleApprove(row: PlayerAdjustListItem) {
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

function openReject(row?: PlayerAdjustListItem) {
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
  filterPlayerId.value = '';
  filterPlayerName.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterAdminUserName.value = '';
  filterReason.value = -1;
  filterOrderId.value = '';
  filterHandleType.value = '';
  filterWaterType.value = '';
  filterCreateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerAdjustListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
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
          value: (row) => formatAdjustApprove(row.Approve),
        },
        {
          header: '创建时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        {
          header: '类型',
          value: (row) => formatAdjustReason(row.Reason),
        },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        {
          header: '调整方式',
          value: (row) => formatAdjustHandleType(row.HandleType),
        },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        {
          header: '玩家ID',
          value: (row) => String(row.PlayerId ?? '-'),
        },
        {
          header: '玩家昵称',
          value: (row) => row.PlayerName || '-',
        },
        { header: '代理账号', value: (row) => row.AdminUserName || '-' },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        { header: '所属渠道', value: (row) => formatChannel(row) },
        {
          header: '调整金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        { header: '申请备注', value: (row) => row.HandleDesc || '-' },
        {
          header: '流水类型',
          value: (row) => formatAdjustWaterType(row.HandleType, row.WaterType),
        },
        {
          header: '调整流水',
          value: (row) => formatAdjustWater(row),
        },
        { header: '申请账号', value: (row) => row.HandlerName || '-' },
      ],
      `调整审核_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

function onRejectSuccess() {
  selectedRows.value = [];
  gridApi.reload();
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @change="normalizeLoginAccount"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerName"
          allow-clear
          placeholder="请输入玩家昵称"
        >
          <template #addonBefore>玩家昵称</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品名称</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          :options="packageSelectOptions"
          show-search
          :filter-option="
            (input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
          "
          placeholder="请选择产品名称"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAdminUserName"
          allow-clear
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">调整类型</span>
        <Select
          v-model:value="filterReason"
          :options="ADJUST_REASON_OPTIONS"
          placeholder="请选择调整类型"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">调整方式</span>
        <Select
          v-model:value="filterHandleType"
          :options="ADJUST_AUDIT_HANDLE_TYPE_OPTIONS"
          placeholder="请选择调整方式"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">流水类型</span>
        <Select
          v-model:value="filterWaterType"
          :options="ADJUST_AUDIT_WATER_TYPE_OPTIONS"
          placeholder="请选择流水类型"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterCreateRange" label="创建时间" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExport"
      >
        导出
      </Button>
      <Button v-if="canBatchApprove" type="primary" @click="handleBatchApprove">
        批量通过
      </Button>
      <Button v-if="canBatchReject" danger @click="openReject()">
        批量拒绝
      </Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #approve="{ row }">
        <Tag :color="getAdjustApproveColor(row.Approve)">
          {{ formatAdjustApprove(row.Approve) }}
        </Tag>
      </template>
      <template #adminUserName="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.AdminUserName"
        />
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="0">
          <Button
            v-if="canApprove && canSelectRow(row)"
            size="small"
            type="link"
            @click="handleApprove(row)"
          >
            通过
          </Button>
          <Button
            v-if="canReject && canSelectRow(row)"
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

    <AdjustAuditActionModal
      v-model:open="rejectOpen"
      :row="rejectRow"
      :selected-ids="selectedIds"
      :selected-accounts="
        selectedRows
          .map((row) => row.LoginAccount)
          .filter(Boolean)
          .join(',')
      "
      @success="onRejectSuccess"
    />
    <PassPopup ref="passPopupRef" @confirm="handleApprovePassConfirm" />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10099 才能查看调整审核"
    title="无权限"
  />
</template>
