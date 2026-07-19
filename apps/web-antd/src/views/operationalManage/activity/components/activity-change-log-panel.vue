<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchActivityChangeLogListApi } from '#/api/operationManage/activity';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import {
  ACTIVITY_FILTER_TYPE_OPTIONS,
  buildUnixRangeQuery,
  formatActivityType,
} from './activity-shared';

defineOptions({ name: 'ActivityChangeLogPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(12102));

const filterId = ref('');
const filterName = ref('');
const filterType = ref<number | string>();
const updateTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const typeOptions = ACTIVITY_FILTER_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    Id: filterId.value || '',
    Name: filterName.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Type: filterType.value ?? '',
    ...buildUnixRangeQuery(updateTimeRange.value, 'BeginTime', 'EndTime'),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'Uid',
      formatter: ({ row }) => `${row.Uid ?? row.Id ?? '-'}(${row.Type ?? '-'})`,
      minWidth: 120,
      title: '活动ID(模板ID)',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 120,
      title: '活动类型',
    },
    { field: 'Name', minWidth: 160, title: '活动名称' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '最后操作时间',
    },
    { field: 'AdminUsername', minWidth: 100, title: '操作人' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canView.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchActivityChangeLogListApi(buildQuery(page));
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
    <div v-if="!canView" class="py-8 text-center text-gray-400">
      无编辑记录查看权限 (12102)
    </div>
    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterId"
          allow-clear
          placeholder="活动ID"
          style="width: 140px"
        />
        <Input
          v-model:value="filterName"
          allow-clear
          placeholder="活动名称"
          style="width: 180px"
        />
        <Select
          v-model:value="filterType"
          allow-clear
          class="w-40"
          :options="typeOptions"
          placeholder="活动类型"
        />
        <DatePicker.RangePicker
          v-model:value="updateTimeRange"
          :placeholder="['操作开始', '操作结束']"
        />
        <Button type="primary" @click="gridApi.reload()">查询</Button>
      </div>
      <Grid>
        <template #action>
          <Button disabled size="small" type="link">详情</Button>
        </template>
      </Grid>
    </template>
  </div>
</template>
