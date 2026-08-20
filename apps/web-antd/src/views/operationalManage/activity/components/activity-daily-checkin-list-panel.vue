<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDailyCheckInListApi } from '#/api/operationManage/activity';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityDailyCheckinListPanel' });

const filterId = ref('');
const filterEventType = ref<number | string>();
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const eventTypeOptions = [
  { label: '连续签到', value: 1 },
  { label: '累计签到', value: 2 },
];

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    EventType: filterEventType.value ?? '',
    Id: filterId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...buildUnixRangeQuery(dateRange.value, 'BeginTime', 'EndTime'),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 90, title: '活动ID' },
    {
      field: 'EventType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 2 ? '累计签到' : '连续签到',
      minWidth: 100,
      title: '活动类型',
    },
    { field: 'Name', minWidth: 160, title: '活动名称' },
    {
      field: 'Status',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '开启' : '关闭'),
      minWidth: 90,
      title: '状态',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 120,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDailyCheckInListApi(buildQuery(page));
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
    <div class="mb-3 text-xs text-gray-400">
      签到活动完整对话框尚未迁移，编辑按钮已禁用。
    </div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterId"
            allow-clear
            placeholder="请输入活动ID"
          >
            <template #addonBefore>活动ID</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">活动类型</span>
          <Select
            v-model:value="filterEventType"
            allow-clear
            :options="eventTypeOptions"
            placeholder="请选择活动类型"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
      </div>
    </div>
    <Grid>
      <template #action>
        <Button disabled size="small" type="link">编辑</Button>
      </template>
    </Grid>
  </div>
</template>
