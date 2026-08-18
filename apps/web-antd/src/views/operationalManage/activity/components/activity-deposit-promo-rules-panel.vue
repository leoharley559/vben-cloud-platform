<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import {
  Alert,
  Button,
  Select,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDepositPromoListApi } from '#/api/operationManage/activity';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'ActivityDepositPromoRulesPanel' });

const { packageOptions } = useOperationOptions();
const filterPackageId = ref<number | string>();

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 90, title: '方案ID' },
    { field: 'Name', minWidth: 160, title: '方案名称' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
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
        const result = await fetchDepositPromoListApi({
          PackageId: filterPackageId.value || '',
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

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div>
    <Alert
      class="mb-4"
      show-icon
      type="info"
      message="存款优惠完整规则编辑器（VIP 分层/首存周期等）尚未迁移，当前为方案列表只读。"
    />
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <Space.Compact>
        <span class="query-field-addon">产品包</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
         
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
    </div>
  </div>
    <Grid>
      <template #action>
        <Button disabled size="small" type="link">编辑规则</Button>
      </template>
    </Grid>
  </div>
</template>
