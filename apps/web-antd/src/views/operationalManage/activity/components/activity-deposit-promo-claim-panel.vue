<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDepositPromoClaimHistoryApi } from '#/api/operationManage/activity';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityDepositPromoClaimPanel' });

const { packageOptions } = useOperationOptions();

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterPlatformOrderId = ref('');
const filterGameOrderId = ref('');
const filterDiscountType = ref<number | string>();
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>([
  dayjs().subtract(1, 'day').startOf('day'),
  dayjs().subtract(1, 'day').endOf('day'),
]);

const discountTypeOptions = [
  { label: '全部', value: '' },
  { label: '存款优惠', value: 1 },
  { label: '首存优惠', value: 2 },
];

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    DiscountType: filterDiscountType.value ?? '',
    GameOrderId: filterGameOrderId.value || '',
    LoginAccount: filterLoginAccount.value || '',
    PackageId: filterPackageId.value || '',
    PlatformOrderId: filterPlatformOrderId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...buildUnixRangeQuery(dateRange.value, 'BeginTime', 'EndTime'),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: 'ID' },
    {
      field: 'DiscountType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 2 ? '首存优惠' : '存款优惠',
      minWidth: 100,
      title: '活动类型',
    },
    { field: 'PlatformOrderId', minWidth: 140, title: '后台订单号' },
    { field: 'GameOrderId', minWidth: 140, title: '游戏订单号' },
    { field: 'PlayerAccount', minWidth: 120, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    {
      field: 'PayAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '存款金额',
    },
    {
      field: 'DiscountAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '优惠金额',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '创建时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDepositPromoClaimHistoryApi(buildQuery(page));
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
      <Input
        v-model:value="filterPlatformOrderId"
        allow-clear
        placeholder="后台订单号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterGameOrderId"
        allow-clear
        placeholder="游戏订单号"
        style="width: 160px"
      />
      <Select
        v-model:value="filterDiscountType"
        allow-clear
        class="w-32"
        :options="discountTypeOptions"
        placeholder="活动类型"
      />
      <DatePicker.RangePicker v-model:value="dateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid />
  </div>
</template>
