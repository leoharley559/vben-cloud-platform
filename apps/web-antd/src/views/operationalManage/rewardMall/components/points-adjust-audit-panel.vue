<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

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
  approveRewardPointAdjustApi,
  fetchRewardPointAdjustListApi,
} from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatOperationDateTime } from '#/utils/operation-status';
import { REWARD_POINT_ADJUST_AUDIT_PAGE_ID } from '#/utils/security-page-ids';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import {
  REWARD_ADJUST_HANDLE_TYPE_OPTIONS,
  formatRewardAdjustApprove,
  formatRewardAdjustHandleType,
  getRewardAdjustApproveColor,
  getRewardAdjustHandleTypeColor,
} from './reward-mall-shared';

defineOptions({ name: 'PointsAdjustAuditPanel' });

interface AdjustRow {
  AdminId?: number | string;
  AdminUserName?: string;
  Amount?: number | string;
  Approve?: number;
  ChannelId?: number | string;
  CreateTime?: number | string;
  HandleDesc?: string;
  HandleType?: number;
  Id: number | string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canViewTable = computed(() => checkPermission(13336));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterOrderId = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterAdminUserName = ref('');
const filterHandleType = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const selectedRows = ref<AdjustRow[]>([]);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const pendingApprove = ref<{ ids: string } | null>(null);
const rejectOpen = ref(false);
const rejectRemark = ref('');
const rejectIds = ref('');
const exportLoading = ref(false);

function canSelectRow(row: AdjustRow) {
  return (
    Number(row.Approve) === 1 &&
    !isSameAcctActionRestricted(REWARD_POINT_ADJUST_AUDIT_PAGE_ID, row.AdminId)
  );
}

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdjustType: 1,
    AdminUserName: filterAdminUserName.value.trim(),
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    ChannelIds: channelIdsParam(),
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    HandleType: filterHandleType.value,
    IsApprove: true,
    LoginAccount: filterLoginAccount.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value,
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
  };
}

const gridOptions: VxeTableGridOptions<AdjustRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canSelectRow(row as AdjustRow),
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
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
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
      field: 'HandleType',
      minWidth: 90,
      slots: { default: 'handleType' },
      title: '调整方式',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'AdminUserName', minWidth: 110, title: '代理账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '所属渠道' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => String(cellValue ?? '-'),
      minWidth: 110,
      title: '调整积分',
    },
    {
      field: 'HandleDesc',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
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
        const result = await fetchRewardPointAdjustListApi(
          getQueryParams(page),
        );
        return {
          items: (result?.Items || []) as unknown as AdjustRow[],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: AdjustRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: AdjustRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function approveRows(ids: string) {
  Modal.confirm({
    content: '确认通过选中的积分调整申请？',
    title: '通过审核',
    onOk: () => {
      pendingApprove.value = { ids };
      passPopupRef.value?.validate(REWARD_POINT_ADJUST_AUDIT_PAGE_ID);
    },
  });
}

async function handleApprovePassConfirm(data: Record<string, unknown>) {
  if (!pendingApprove.value?.ids) {
    return;
  }
  try {
    await approveRewardPointAdjustApi({
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

function handleApprove(row: AdjustRow) {
  if (!row.Id) {
    return;
  }
  approveRows(String(row.Id));
}

function handleBatchApprove() {
  if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  }
  approveRows(selectedIds.value);
}

function openReject(row?: AdjustRow) {
  if (row) {
    rejectIds.value = String(row.Id);
  } else if (!selectedIds.value) {
    message.warning('请先选择记录');
    return;
  } else {
    rejectIds.value = selectedIds.value;
  }
  rejectRemark.value = '';
  rejectOpen.value = true;
}

function handleRejectOk() {
  if (!rejectRemark.value.trim()) {
    message.warning('请填写拒绝备注');
    return;
  }
  passPopupRef.value?.validate(REWARD_POINT_ADJUST_AUDIT_PAGE_ID, {
    mode: 'reject',
  });
}

async function handlePassConfirm(data: Record<string, unknown>) {
  if (data.mode === 'reject') {
    try {
      await approveRewardPointAdjustApi({
        Approve: 3,
        ApproveRemark: rejectRemark.value,
        Ids: rejectIds.value,
        ValidCode: data.ValidCode || '',
      });
      message.success('已拒绝');
      rejectOpen.value = false;
      selectedRows.value = [];
      gridApi.reload();
    } catch {
      // error already toasted
    }
    return;
  }
  await handleApprovePassConfirm(data);
}

function resetFilters() {
  filterLoginAccount.value = '';
  filterOrderId.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterAdminUserName.value = '';
  filterHandleType.value = '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchRewardPointAdjustListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
    });
    const rows = (result?.Items || []) as unknown as AdjustRow[];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        {
          header: '审核状态',
          value: (row) => formatRewardAdjustApprove(row.Approve),
        },
        {
          header: '申请时间',
          value: (row) => formatOperationDateTime(row.CreateTime),
        },
        { header: '订单号', value: (row) => row.OrderId || '-' },
        {
          header: '调整方式',
          value: (row) => formatRewardAdjustHandleType(row.HandleType),
        },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '代理账号', value: (row) => row.AdminUserName || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '所属渠道', value: (row) => row.ChannelId || '-' },
        { header: '调整积分', value: (row) => row.Amount ?? '-' },
        { header: '申请备注', value: (row) => row.HandleDesc || '-' },
      ],
      `积分调整审核_${dayjs().format('YYYYMMDDHHmmss')}`,
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
        placeholder="订单号"
        style="width: 180px"
      />
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 160px"
      />
      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-36"
        :options="
          packageOptions.map((item) => ({
            label: item.PackageName,
            value: item.PackageId,
          }))
        "
        placeholder="所属产品"
        show-search
      />
      <ChannelSelect v-model:value="filterChannelIds" style="width: 200px" />
      <Input
        v-model:value="filterAdminUserName"
        allow-clear
        placeholder="代理账号"
        style="width: 150px"
      />
      <Select
        v-model:value="filterHandleType"
        allow-clear
        class="w-28"
        :options="
          REWARD_ADJUST_HANDLE_TYPE_OPTIONS.filter((item) => item.value !== -1)
        "
        placeholder="调整方式"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button :loading="exportLoading" type="primary" @click="handleExport">
        导出
      </Button>
      <Button type="primary" @click="handleBatchApprove">批量通过</Button>
      <Button danger @click="openReject()">批量拒绝</Button>
    </div>

    <Grid>
      <template #approve="{ row }">
        <Tag :color="getRewardAdjustApproveColor(row.Approve)">
          {{ formatRewardAdjustApprove(row.Approve) }}
        </Tag>
      </template>
      <template #handleType="{ row }">
        <span
          :style="{ color: getRewardAdjustHandleTypeColor(row.HandleType) }"
        >
          {{ formatRewardAdjustHandleType(row.HandleType) }}
        </span>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="0">
          <Button
            v-if="canSelectRow(row)"
            size="small"
            type="link"
            @click="handleApprove(row)"
          >
            通过
          </Button>
          <Button
            v-if="canSelectRow(row)"
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

    <Modal v-model:open="rejectOpen" title="拒绝审核" @ok="handleRejectOk">
      <Form layout="vertical">
        <Form.Item label="拒绝备注" required>
          <Input.TextArea
            v-model:value="rejectRemark"
            :rows="3"
            placeholder="请输入拒绝备注"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 13336 才能查看积分调整审核"
    title="无权限"
  />
</template>
