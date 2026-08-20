<script lang="ts" setup>
import type { OngoingActivityRow } from './activity-shared';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchActivityHistoryListApi } from '#/api/operationManage/activity';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import { ACTIVITY_FILTER_TYPE_OPTIONS, formatActivityTimeCell, formatActivityType, formatShowTimeCell } from './activity-shared';

defineOptions({ name: 'ActivityHistoryPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(10_310));

const filterId = ref('');
const filterName = ref('');
const filterType = ref<number | string>();

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
  };
}

const gridOptions: VxeTableGridOptions<OngoingActivityRow> = {
  columns: [
    {
      field: 'Id',
      formatter: ({ row }) => `${row.Id}(${row.Type ?? '-'})`,
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
      field: 'showTime',
      minWidth: 200,
      slots: { default: 'showTime' },
      title: '展示时间',
    },
    {
      field: 'activityTime',
      minWidth: 200,
      slots: { default: 'activityTime' },
      title: '活动时间',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
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
        const result = await fetchActivityHistoryListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as OngoingActivityRow[];
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
      无历史活动查看权限 (10310)
    </div>
    <template v-else>
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
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterName"
              allow-clear
              placeholder="请输入活动名称"
            >
              <template #addonBefore>活动名称</template>
            </Input>
          </div>
          <Space.Compact>
            <span class="query-field-addon">活动类型</span>
            <Select
              v-model:value="filterType"
              allow-clear
              :options="typeOptions"
              placeholder="请选择活动类型"
            />
          </Space.Compact>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="gridApi.reload()">查询</Button>
          </div>
        </div>
      </div>
      <Grid>
        <template #showTime="{ row }">
          <div class="whitespace-pre-line text-xs">
            {{ formatShowTimeCell(row) }}
          </div>
        </template>
        <template #activityTime="{ row }">
          <div class="whitespace-pre-line text-xs">
            {{ formatActivityTimeCell(row) }}
          </div>
        </template>
        <template #action>
          <Button disabled size="small">重新开启</Button>
          <Button disabled class="ml-1" size="small">克隆</Button>
        </template>
      </Grid>
    </template>
  </div>
</template>
