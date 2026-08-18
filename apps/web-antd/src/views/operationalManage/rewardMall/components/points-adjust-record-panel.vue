<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
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
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getTodayRangeSeconds } from '#/utils/date-range';
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

/** 对齐旧站 adjustList：申请/审批时间默认均为今天 */
const defaultRange = getTodayRangeSeconds();
const totalAmount = ref(0);
const exportLoading = ref(false);

const summaryItems = computed(() => [
  {
    label: '调整合计（积分）',
    value: totalAmount.value,
  },
]);

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
const filterCreateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterApproveRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
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
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.unix() : '',
    ApproveName: filterApproveName.value.trim(),
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: channelIdsParam(),
    Done: normalizeMultiParam(filterDone.value, '0,1,2,3,4'),
    EndTime: end ? end.unix() : '',
    HandleType: filterHandleType.value,
    IsApprove: false,
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
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
    { field: 'AdminUserName', minWidth: 110, slots: { default: 'adminUserName' }, title: '代理账号' },
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
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">所属产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
         
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          show-search
          placeholder="请选择所属产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model:value="filterChannelIds" placeholder="请输入渠道号" />
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
        <span class="query-field-addon">游戏状态</span>
        <Select
          v-model:value="filterDone"
          allow-clear
         
          mode="multiple"
          :max-tag-count="1"
          :options="REWARD_ADJUST_DONE_OPTIONS"
          placeholder="请选择游戏状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">调整类型</span>
        <Select
          v-model:value="filterAdjustType"
         
          :options="REWARD_ADJUST_TYPE_OPTIONS"
          placeholder="请选择调整类型"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">调整方式</span>
        <Select
          v-model:value="filterHandleType"
         
          :options="REWARD_ADJUST_HANDLE_TYPE_OPTIONS"
          placeholder="请选择调整方式"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="filterApprove"
         
          :options="REWARD_ADJUST_APPROVE_RECORD_OPTIONS"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterApplyName"
          allow-clear
          placeholder="请输入申请账号"
        >
          <template #addonBefore>申请账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterApproveName"
          allow-clear
          placeholder="请输入审核账号"
        >
          <template #addonBefore>审核账号</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterCreateRange" label="创建时间" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterApproveRange" label="审核时间" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button :loading="exportLoading" type="primary" @click="handleExport">
        导出
      </Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
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
