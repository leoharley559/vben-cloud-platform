<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import {
  Button,
  Input,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDailyCheckInPlayerRecordApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
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
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterEventId"
          allow-clear
          placeholder="请输入活动ID"
        >
          <template #addonBefore>活动ID</template>
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
        <span class="query-field-addon">产品包</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
         
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">活动类别</span>
        <Select
          v-model:value="filterEventType"
          allow-clear
         
          :options="eventTypeOptions"
          placeholder="请选择活动类别"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
    </div>
  </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
</template>
