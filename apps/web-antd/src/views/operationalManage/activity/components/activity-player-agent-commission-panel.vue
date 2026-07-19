<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerAgentReportApi } from '#/api/operationManage/activity';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityPlayerAgentCommissionPanel' });

const { packageOptions } = useOperationOptions();

const filterLoginAccount = ref('');
const filterOrderId = ref('');
const filterPackageId = ref<number | string>();
const filterMode = ref('1');
const finishTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const modeOptions = [
  { label: '无限代理', value: '1' },
  { label: 'N级代理', value: '2' },
];

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    LoginAccount: filterLoginAccount.value || '',
    Mode: filterMode.value,
    OrderId: filterOrderId.value || '',
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...buildUnixRangeQuery(
      finishTimeRange.value,
      'BeginFinishTime',
      'EndFinishTime',
    ),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'OrderId', minWidth: 140, title: '订单号' },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    { field: 'Code', minWidth: 100, title: '代理编号' },
    {
      field: 'CommissionType',
      formatter: ({ cellValue }) => {
        const map: Record<number, string> = {
          1: '投注佣金',
          2: '充值佣金',
          3: '成就奖励',
          4: '排行榜',
        };
        return map[Number(cellValue)] || String(cellValue ?? '-');
      },
      minWidth: 110,
      title: '佣金类型',
    },
    {
      field: 'Commission',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '佣金',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '领奖时间',
    },
    {
      field: 'Status',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 2 ? '已领取' : '待领取',
      minWidth: 90,
      title: '状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAgentReportApi(buildQuery(page));
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
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单号"
        style="width: 160px"
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
        v-model:value="filterMode"
        class="w-32"
        :options="modeOptions"
        placeholder="代理模式"
      />
      <DatePicker.RangePicker
        v-model:value="finishTimeRange"
        :placeholder="['领奖开始', '领奖结束']"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid />
  </div>
</template>
