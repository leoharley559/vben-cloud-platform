<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Select, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchActivityOwnTemplateListApi } from '#/api/operationManage/activity';
import { formatActivityType } from '#/utils/bonus-reward';

import { ACTIVITY_FILTER_TYPE_OPTIONS } from './activity-shared';

defineOptions({ name: 'ActivityTemplateOwnPanel' });

const filterType = ref<number | string>();

const typeOptions = ACTIVITY_FILTER_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'Type',
      formatter: ({ row }) =>
        `${formatActivityType(row.Type as number | string)} (${row.Id ?? '-'})`,
      minWidth: 180,
      title: '活动类型',
    },
    { field: 'Name', minWidth: 180, title: '活动名称' },
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
        const result = await fetchActivityOwnTemplateListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
          Type: filterType.value ?? '',
        });
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
          <Button disabled type="primary">添加模板</Button>
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
