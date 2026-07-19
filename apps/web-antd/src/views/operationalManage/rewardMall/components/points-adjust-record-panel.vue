<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Result,
  Select,
  Tag,
  message,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchRewardPointAdjustListApi } from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatOperationDateTime } from '#/utils/operation-status';

import {
  REWARD_ADJUST_APPROVE_RECORD_OPTIONS,
  REWARD_ADJUST_DONE_OPTIONS,
  REWARD_ADJUST_HANDLE_TYPE_OPTIONS,
  REWARD_ADJUST_TYPE_OPTIONS,
  formatRewardAdjustApprove,
  formatRewardAdjustDone,
  formatRewardAdjustHandleType,
  getRewardAdjustApproveColor,
  getRewardAdjustDoneColor,
  getRewardAdjustHandleTypeColor,
} from './reward-mall-shared';

defineOptions({ name: 'PointsAdjustRecordPanel' });

interface AdjustRecordRow {
  AdjustType?: number;
  AdminUserName?: string;
  Amount?: number | string;
  ApplyName?: string;
  Approve?: number;
  ApproveName?: string;
  ApproveRemark?: string;
  ApproveTime?: number | string;
  ChannelId?: number | string;
  CreateTime?: number | string;
  Done?: number;
  HandleType?: number;
  Id?: number | string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  ApplyRemark?: string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canView = computed(() => checkPermission(13337));

const defaultRange = getYesterdayRangeSeconds();
const totalAmount = ref(0);
const exportLoading = ref(false);

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterAdminUserName = ref('');
const filterDone = ref<Array<number | string>>(['0,1,2,3,4']);
const filterAdjustType = ref<number>(1);
const filterHandleType = ref<number>(-1);
const filterApprove = ref<number | string>('2,3,4');
const filterApplyName = ref('');
const filterApproveName = ref('');
const filterCreateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterApproveRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function normalizeMultiParam(
  value: Array<number | string> | number | string,
  fallback: string,
) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const src = Array.isArray(value) ? value.join(',') : String(value);
  const chars = src.replaceAll(',', '');
  return [...new Set(chars)].join(',');
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterCreateRange.value || [];
  const [approveBegin, approveEnd] = filterApproveRange.value || [];
  return {
    AdjustType: filterAdjustType.value,
    AdminUserName: filterAdminUserName.value.trim(),
    ApplyName: filterApplyName.value.trim(),
    Approve: filterApprove.value,
    ApproveBeginTime: approveBegin
      ? approveBegin.startOf('day').unix()
      : defaultRange.BeginTime,
    ApproveEndTime: approveEnd
      ? approveEnd.endOf('day').unix()
      : defaultRange.EndTime,
    ApproveName: filterApproveName.value.trim(),
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    ChannelIds: channelIdsParam(),
    Done: normalizeMultiParam(filterDone.value, '0,1,2,3,4'),
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    HandleType: filterHandleType.value,
    IsApprove: false,
    LoginAccount: filterLoginAccount.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value,
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
  };
}

const gridOptions: VxeTableGridOptions<AdjustRecordRow> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'Done',
      minWidth: 100,
      slots: { default: 'done' },
      title: '游戏状态',
    },
    {
      field: 'AdjustType',
      formatter: () => '积分调整',
      minWidth: 100,
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
    { field: 'PackageName', minWidth: 100, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '所属渠道' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => String(cellValue ?? '-'),
      minWidth: 100,
      title: '调整金额(积分)',
    },
    {
      field: 'ApplyRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    { field: 'ApplyName', minWidth: 110, title: '申请账号' },
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '审核状态',
    },
    { field: 'ApproveName', minWidth: 110, title: '审核账号' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) =>
        Number(cellValue) ? formatOperationDateTime(cellValue as string) : '--',
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'ApproveRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = (await fetchRewardPointAdjustListApi(
          getQueryParams(page),
        )) as {
          Items?: AdjustRecordRow[];
          Pagination?: { MaxCount?: number };
          Total?: number | string;
        };
        totalAmount.value = Number(result?.Total || 0);
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
      '合计',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      String(totalAmount.value),
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function resetFilters() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterAdminUserName.value = '';
  filterDone.value = ['0,1,2,3,4'];
  filterHandleType.value = -1;
  filterApprove.value = '2,3,4';
  filterApplyName.value = '';
  filterApproveName.value = '';
  filterCreateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  filterApproveRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = (await fetchRewardPointAdjustListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
    })) as { Items?: AdjustRecordRow[]; Total?: number | string };
    const rows = result?.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        {
          header: '创建时间',
          value: (row) => formatOperationDateTime(row.CreateTime),
        },
        {
          header: '游戏状态',
          value: (row) => formatRewardAdjustDone(row.Done),
        },
        { header: '类型', value: () => '积分调整' },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        {
          header: '调整方式',
          value: (row) => formatRewardAdjustHandleType(row.HandleType),
        },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '代理账号', value: (row) => row.AdminUserName || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '所属渠道', value: (row) => row.ChannelId || '-' },
        { header: '调整金额(积分)', value: (row) => row.Amount ?? '-' },
        { header: '申请备注', value: (row) => row.ApplyRemark || '-' },
        { header: '申请账号', value: (row) => row.ApplyName || '-' },
        {
          header: '审核状态',
          value: (row) => formatRewardAdjustApprove(row.Approve),
        },
        { header: '审核账号', value: (row) => row.ApproveName || '-' },
        {
          header: '审核时间',
          value: (row) =>
            Number(row.ApproveTime)
              ? formatOperationDateTime(row.ApproveTime)
              : '--',
        },
        { header: '审核备注', value: (row) => row.ApproveRemark || '-' },
      ],
      `积分调整记录_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canView">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 180px"
      />
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 150px"
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
        v-model:value="filterDone"
        allow-clear
        class="w-40"
        mode="multiple"
        :max-tag-count="1"
        :options="REWARD_ADJUST_DONE_OPTIONS"
        placeholder="游戏状态"
      />
      <Select
        v-model:value="filterAdjustType"
        class="w-32"
        :options="REWARD_ADJUST_TYPE_OPTIONS"
        placeholder="调整类型"
      />
      <Select
        v-model:value="filterHandleType"
        class="w-28"
        :options="REWARD_ADJUST_HANDLE_TYPE_OPTIONS"
        placeholder="调整方式"
      />
      <Select
        v-model:value="filterApprove"
        class="w-28"
        :options="REWARD_ADJUST_APPROVE_RECORD_OPTIONS"
        placeholder="状态"
      />
      <Input
        v-model:value="filterApplyName"
        allow-clear
        placeholder="申请账号"
        style="width: 140px"
      />
      <Input
        v-model:value="filterApproveName"
        allow-clear
        placeholder="审核账号"
        style="width: 140px"
      />
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-500">创建时间</span>
        <DatePicker.RangePicker v-model:value="filterCreateRange" />
      </div>
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-500">审核时间</span>
        <DatePicker.RangePicker v-model:value="filterApproveRange" />
      </div>
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button :loading="exportLoading" type="primary" @click="handleExport">
        导出
      </Button>
    </div>

    <div class="mb-2 text-sm text-gray-600">
      调整合计（积分）：{{ totalAmount }}
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #handleType="{ row }">
        <span
          :style="{ color: getRewardAdjustHandleTypeColor(row.HandleType) }"
        >
          {{ formatRewardAdjustHandleType(row.HandleType) }}
        </span>
      </template>
      <template #done="{ row }">
        <Tag :color="getRewardAdjustDoneColor(row.Done)">
          {{ formatRewardAdjustDone(row.Done) }}
        </Tag>
      </template>
      <template #approve="{ row }">
        <Tag :color="getRewardAdjustApproveColor(row.Approve)">
          {{ formatRewardAdjustApprove(row.Approve) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13337 才能查看调整记录"
    title="无权限"
  />
</template>
