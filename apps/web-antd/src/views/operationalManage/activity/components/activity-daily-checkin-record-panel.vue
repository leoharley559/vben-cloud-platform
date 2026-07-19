<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDailyCheckInPlayerRecordApi } from '#/api/operationManage/activity';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityDailyCheckinRecordPanel' });

const { packageOptions } = useOperationOptions();

const filterEventId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterEventType = ref<number | string>();
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const eventTypeOptions = [
  { label: '连续签到', value: 1 },
  { label: '累计签到', value: 2 },
];

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    EventId: filterEventId.value || '',
    EventType: filterEventType.value ?? '',
    LoginAccount: filterLoginAccount.value || '',
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...buildUnixRangeQuery(dateRange.value, 'BeginTime', 'EndTime'),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'EventId', minWidth: 90, title: '活动ID' },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    {
      field: 'EventType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 2 ? '累计签到' : '连续签到',
      minWidth: 100,
      title: '活动类别',
    },
    {
      field: 'CheckInTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '签到时间',
    },
    { field: 'ContinuousDays', minWidth: 100, title: '连续天数' },
    { field: 'RewardName', minWidth: 140, title: '奖励' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDailyCheckInPlayerRecordApi(buildQuery(page));
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterEventId"
        allow-clear
        placeholder="活动ID"
        style="width: 140px"
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
        class="w-40"
        :options="packageOptions"
        placeholder="产品包"
      />
      <Select
        v-model:value="filterEventType"
        allow-clear
        class="w-36"
        :options="eventTypeOptions"
        placeholder="活动类别"
      />
      <DatePicker.RangePicker
        v-model:value="dateRange"
        :placeholder="['签到开始', '签到结束']"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid />
  </div>
</template>
