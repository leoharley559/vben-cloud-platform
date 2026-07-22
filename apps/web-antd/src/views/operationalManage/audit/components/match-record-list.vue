<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityMatchBonusItem } from '#/types/activity-match-bonus';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
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
  approveActivityMatchBonusApi,
  fetchActivityMatchBonusListApi,
  rejectActivityMatchBonusApi,
  updateActivityMatchBonusRemarkApi,
} from '#/api/operationManage/activity-match-bonus';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import {
  formatMatchAuditStatus,
  getMatchAuditStatusColor,
} from '#/utils/platform-transfer';
import {
  PLAYER_STATUS_OPTIONS,
  formatPlayerStatus,
} from '#/utils/player-status';

defineOptions({ name: 'MatchRecordList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(11659));
const canBatchApprove = computed(() => checkPermission(11660));
const canBatchReject = computed(() => checkPermission(11661));
const canExport = computed(() => checkPermission(11941));
const canEditRemark = computed(() => checkPermission(11662));

const defaultRange = getYesterdayRangeSeconds();
const selectedRows = ref<ActivityMatchBonusItem[]>([]);
const exportLoading = ref(false);

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterOrderId = ref('');
const filterPageTitle = ref('');
const filterBonusTitle = ref('');
const filterApplyNote = ref('');
const filterAuditStatus = ref<number | undefined>(undefined);
const filterPlayerStatus = ref<number | undefined>(undefined);
const filterVipLevel = ref(-1);
const filterReviewNote = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const remarkOpen = ref(false);
const remarkSubmitting = ref(false);
const remarkForm = ref({
  Id: '' as number | string,
  Remark: '',
});

const auditStatusOptions = [
  { label: '待审核', value: 1 },
  { label: '通过', value: 2 },
  { label: '拒绝', value: 3 },
];

const reviewNoteOptions = [
  { label: '全部', value: '' },
  { label: '同IP', value: '同IP' },
  { label: '同设备', value: '同设备' },
];

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

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

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    ApplyNote: filterApplyNote.value.trim(),
    AuditStatus: filterAuditStatus.value ?? '',
    BonusTitle: filterBonusTitle.value.trim(),
    EndApplyTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    IsExp: false,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    PageTitle: filterPageTitle.value.trim(),
    PlayerStatus: filterPlayerStatus.value ?? '',
    ReviewNote: filterReviewNote.value,
    StartApplyTime: begin
      ? begin.startOf('day').unix()
      : defaultRange.BeginTime,
    VipLevel: filterVipLevel.value,
  };
}

function canSelectRow(row: ActivityMatchBonusItem) {
  return Number(row.AuditStatus) === 1;
}

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);
const selectedPlayerIds = computed(() =>
  selectedRows.value
    .map((row) => row.PlayerId)
    .filter(Boolean)
    .join(','),
);
const selectedAccounts = computed(() =>
  selectedRows.value
    .map((row) => row.LoginAccount)
    .filter(Boolean)
    .join(','),
);

const gridOptions: VxeTableGridOptions<ActivityMatchBonusItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canSelectRow(row as ActivityMatchBonusItem),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'OrderId',
      minWidth: 170,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'AuditStatus',
      minWidth: 100,
      slots: { default: 'auditStatus' },
      title: '审核状态',
    },
    {
      field: 'LoginAccount',
      minWidth: 150,
      slots: { default: 'loginAccount' },
      title: '游戏账号(状态)',
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
    {
      field: 'BonusTitle',
      minWidth: 160,
      slots: { default: 'bonusTitle' },
      title: '活动标题',
    },
    { field: 'PageTitle', minWidth: 120, title: '活动分页' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelName', minWidth: 120, title: '所在渠道' },
    {
      field: 'ApplyTime',
      formatter: ({ cellValue, row }) =>
        formatDateTime(cellValue ?? row.CreateTime),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'ApplyNote1',
      minWidth: 100,
      showOverflow: 'tooltip',
      title: '申请信息1',
    },
    {
      field: 'ApplyNote2',
      minWidth: 100,
      showOverflow: 'tooltip',
      title: '申请信息2',
    },
    {
      field: 'ApplyNote3',
      minWidth: 100,
      showOverflow: 'tooltip',
      title: '申请信息3',
    },
    {
      field: 'ApplyNote4',
      minWidth: 100,
      showOverflow: 'tooltip',
      title: '申请信息4',
    },
    { field: 'Operator', minWidth: 100, title: '审核人' },
    {
      field: 'OperatorTime',
      formatter: ({ cellValue, row }) =>
        Number(row.AuditStatus) === 1 ? '-' : formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'ReviewNote',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '风控信息',
    },
    {
      field: 'Remarks',
      minWidth: 120,
      slots: { default: 'remarks' },
      title: '备注',
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
        const result = await fetchActivityMatchBonusListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
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
    checkboxAll: ({ records }: { records: ActivityMatchBonusItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: ActivityMatchBonusItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);
const hasSelection = computed(() => selectedRows.value.length > 0);

function approveRows(ids: string, playerIds: string, accounts: string) {
  Modal.confirm({
    content: `确认通过以下账号的申请记录？${accounts}`,
    title: '通过审核',
    onOk: async () => {
      await approveActivityMatchBonusApi({
        AuditStatus: 2,
        Ids: ids,
        PlayerIds: playerIds,
      });
      message.success('审核通过');
      selectedRows.value = [];
      gridApi.reload();
    },
  });
}

function rejectRows(ids: string, playerIds: string, accounts: string) {
  Modal.confirm({
    content: `确认拒绝以下账号的申请记录？${accounts}`,
    title: '拒绝审核',
    onOk: async () => {
      await rejectActivityMatchBonusApi({
        AuditStatus: 3,
        Ids: ids,
        PlayerIds: playerIds,
      });
      message.success('已拒绝');
      selectedRows.value = [];
      gridApi.reload();
    },
  });
}

function handleApprove(row: ActivityMatchBonusItem) {
  if (!row.Id || !row.PlayerId) {
    return;
  }
  void approveRows(
    String(row.Id),
    String(row.PlayerId),
    String(row.LoginAccount || ''),
  );
}

function handleReject(row: ActivityMatchBonusItem) {
  if (!row.Id || !row.PlayerId) {
    return;
  }
  void rejectRows(
    String(row.Id),
    String(row.PlayerId),
    String(row.LoginAccount || ''),
  );
}

function handleBatchApprove() {
  if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  }
  void approveRows(
    selectedIds.value,
    selectedPlayerIds.value,
    selectedAccounts.value,
  );
}

function handleBatchReject() {
  if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  }
  void rejectRows(
    selectedIds.value,
    selectedPlayerIds.value,
    selectedAccounts.value,
  );
}

function openRemarkModal(row: ActivityMatchBonusItem) {
  remarkForm.value = {
    Id: row.Id || '',
    Remark: String(row.Remarks || ''),
  };
  remarkOpen.value = true;
}

async function submitRemark() {
  if (!remarkForm.value.Id) {
    return;
  }
  remarkSubmitting.value = true;
  try {
    await updateActivityMatchBonusRemarkApi({
      Id: remarkForm.value.Id,
      Remark: remarkForm.value.Remark,
    });
    message.success('备注已更新');
    remarkOpen.value = false;
    gridApi.reload();
  } finally {
    remarkSubmitting.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchActivityMatchBonusListApi({
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
        { header: '订单号', value: (row) => row.OrderId || '-' },
        {
          header: '审核状态',
          value: (row) => formatMatchAuditStatus(row.AuditStatus),
        },
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
        {
          header: '活动标题',
          value: (row) => `${row.BonusTitle || '-'}(${row.BonusId ?? '-'})`,
        },
        { header: '活动分页', value: (row) => row.PageTitle || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '所在渠道', value: (row) => row.ChannelName || '-' },
        {
          header: '申请时间',
          value: (row) => formatDateTime(row.ApplyTime ?? row.CreateTime),
        },
        { header: '申请信息1', value: (row) => row.ApplyNote1 || '-' },
        { header: '申请信息2', value: (row) => row.ApplyNote2 || '-' },
        { header: '申请信息3', value: (row) => row.ApplyNote3 || '-' },
        { header: '申请信息4', value: (row) => row.ApplyNote4 || '-' },
        { header: '审核人', value: (row) => row.Operator || '-' },
        {
          header: '审核时间',
          value: (row) =>
            Number(row.AuditStatus) === 1
              ? '-'
              : formatDateTime(row.OperatorTime),
        },
        { header: '风控信息', value: (row) => row.ReviewNote || '-' },
        { header: '备注', value: (row) => row.Remarks || '-' },
      ],
      `申请记录_${dayjs().format('YYYYMMDDHHmmss')}`,
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
      <Input
        v-model:value="filterBonusTitle"
        allow-clear
        placeholder="活动标题"
        style="width: 180px"
      >
        <template #addonBefore>活动标题</template>
      </Input>
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
      <Input
        v-model:value="filterApplyNote"
        allow-clear
        placeholder="申请信息"
        style="width: 180px"
      >
        <template #addonBefore>申请信息</template>
      </Input>
      <Select
        v-model:value="filterAuditStatus"
        allow-clear
        :options="auditStatusOptions"
        placeholder="审核状态"
        style="width: 120px"
      />
      <Select
        v-model:value="filterPlayerStatus"
        allow-clear
        :options="PLAYER_STATUS_OPTIONS"
        placeholder="玩家状态"
        style="width: 120px"
      />
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
        style="width: 100px"
      />
      <Select
        v-model:value="filterReviewNote"
        :options="reviewNoteOptions"
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
        @click="handleBatchReject"
      >
        批量拒绝
      </Button>
    </div>

    <Grid>
      <template #auditStatus="{ row }">
        <Tag :color="getMatchAuditStatusColor(row.AuditStatus)">
          {{ formatMatchAuditStatus(row.AuditStatus) }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <div>
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
          <div class="text-xs text-gray-500">
            ({{ formatPlayerStatus(row.PlayerStatus) }})
          </div>
        </div>
      </template>
      <template #bonusTitle="{ row }">
        <div>
          <div>{{ row.BonusTitle || '-' }}</div>
          <div class="text-xs text-gray-500">({{ row.BonusId ?? '-' }})</div>
        </div>
      </template>
      <template #remarks="{ row }">
        <Button
          v-if="canEditRemark"
          size="small"
          type="link"
          @click="openRemarkModal(row)"
        >
          {{ row.Remarks || '编辑备注' }}
        </Button>
        <span v-else>{{ row.Remarks || '-' }}</span>
      </template>
      <template #actions="{ row }">
        <Space v-if="Number(row.AuditStatus) === 1" :size="0" wrap>
          <Button size="small" type="link" @click="handleApprove(row)">
            通过
          </Button>
          <Button danger size="small" type="link" @click="handleReject(row)">
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="remarkOpen"
      :confirm-loading="remarkSubmitting"
      title="编辑备注"
      @ok="submitRemark"
    >
      <Form layout="vertical">
        <Form.Item label="备注">
          <Input.TextArea
            v-model:value="remarkForm.Remark"
            :rows="4"
            placeholder="请输入备注"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11659 才能查看申请记录"
    title="无权限"
  />
</template>
