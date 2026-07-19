<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchActivityTemplateListApi } from '#/api/operationManage/activity';
import { formatActivityType } from '#/utils/bonus-reward';

defineOptions({ name: 'ActivityTemplateSystemPanel' });

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: '模板ID' },
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 140,
      title: '活动类型',
    },
    { field: 'Name', minWidth: 180, title: '活动名称' },
    { field: 'Description', minWidth: 220, title: '活动描述' },
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
        const result = await fetchActivityTemplateListApi({
          IsTemplate: false,
          Page: page.currentPage,
          PageSize: page.pageSize,
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

const [Grid] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <Grid>
    <template #action>
      <Button disabled size="small" type="primary">添加活动</Button>
    </template>
  </Grid>
</template>
