<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Button, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDeveloperNamesListApi } from '#/api/netcash/agency';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'DeveloperList' });

const developerName = ref('');

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    CurrPage: page.currentPage,
    DeveloperName: developerName.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'DeveloperName', minWidth: 160, title: '发展人名称' },
    { field: 'Remark', minWidth: 200, title: '备注' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue as string),
      minWidth: 180,
      title: '创建时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDeveloperNamesListApi(
          getQueryParams(page) as never,
        );
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

onMounted(() => {
  gridApi.reload();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="developerName"
        allow-clear
        placeholder="发展人名称"
        style="width: 220px"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <span class="text-xs text-gray-400"> 新建/编辑发展人待下一迭代迁移 </span>
    </div>
    <Grid />
  </div>
</template>
