<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import {
  Button,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchNewPlayerDrawListApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { formatActivityType } from '#/utils/bonus-reward';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityBeginnerTurntableDetailPanel' });

const filterStatus = ref(0);
const filterActivityType = ref(0);
const drawTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const applyTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const statusOptions = [
  { label: '全部', value: 0 },
  { label: '成功', value: 1 },
  { label: '未领取', value: 2 },
  { label: '失效', value: 3 },
];

const activityTypeOptions = [
  { label: '全部', value: 0 },
  { label: '注册转盘', value: 10022 },
  { label: '首存转盘', value: 10016 },
];

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    ActivityType: filterActivityType.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: filterStatus.value,
    ...buildUnixRangeQuery(drawTimeRange.value, 'DrawBeginTime', 'DrawEndTime'),
    ...buildUnixRangeQuery(
      applyTimeRange.value,
      'ApplyBeginTime',
      'ApplyEndTime',
    ),
  };
}

const prizeStatusMap: Record<number, string> = {
  1: '成功',
  2: '未领取',
  3: '失效',
};

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Account', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
    { field: 'BindPhone', minWidth: 120, title: '手机号' },
    {
      field: 'RegistTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '注册时间',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '抽奖时间',
    },
    {
      field: 'ApplyTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '领奖时间',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 110,
      title: '转盘类型',
    },
    {
      field: 'Bonus',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '抽中金额',
    },
    {
      field: 'Status',
      formatter: ({ cellValue }) =>
        prizeStatusMap[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 90,
      title: '奖品状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchNewPlayerDrawListApi(buildQuery(page));
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <Space.Compact>
        <span class="query-field-addon">奖品状态</span>
        <Select
          v-model:value="filterStatus"
         
          :options="statusOptions"
          placeholder="请选择奖品状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">转盘类型</span>
        <Select
          v-model:value="filterActivityType"
         
          :options="activityTypeOptions"
          placeholder="请选择转盘类型"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="drawTimeRange" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="applyTimeRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
    </div>
  </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.Account || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
</template>
