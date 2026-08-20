<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Input } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPromoCodeActivityListApi } from '#/api/operationManage/promotion-code';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityPromoCodeActivePanel' });

const filterId = ref('');
const filterName = ref('');
const activeTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    Description: '',
    Id: filterId.value || '',
    Name: filterName.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...buildUnixRangeQuery(activeTimeRange.value, 'OpenTime', 'ExpireTime'),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'Status',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '开启' : '关闭'),
      minWidth: 90,
      title: '状态',
    },
    { field: 'Id', minWidth: 90, title: '优惠码ID' },
    { field: 'Name', minWidth: 160, title: '优惠码名称' },
    { field: 'Description', minWidth: 180, title: '备注' },
    {
      field: 'OpenTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '生效时间',
    },
    {
      field: 'ExpireTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '失效时间',
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
        const result = await fetchPromoCodeActivityListApi(buildQuery(page));
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
      优惠码 upsert / 全局配置 / 补码尚未迁移，创建与编辑按钮已禁用。
    </div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterId"
            allow-clear
            placeholder="请输入优惠码ID"
          >
            <template #addonBefore>优惠码ID</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterName"
            allow-clear
            placeholder="请输入优惠码名称"
          >
            <template #addonBefore>优惠码名称</template>
          </Input>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="activeTimeRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
          <Button disabled type="primary">添加优惠码</Button>
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
