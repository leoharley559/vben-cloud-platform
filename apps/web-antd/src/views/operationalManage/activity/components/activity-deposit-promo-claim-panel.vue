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
import { fetchDepositPromoClaimHistoryApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
    { field: 'PlayerAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
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
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
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
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlatformOrderId"
          allow-clear
          placeholder="请输入后台订单号"
        >
          <template #addonBefore>后台订单号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterGameOrderId"
          allow-clear
          placeholder="请输入游戏订单号"
        >
          <template #addonBefore>游戏订单号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">活动类型</span>
        <Select
          v-model:value="filterDiscountType"
          allow-clear
         
          :options="discountTypeOptions"
          placeholder="请选择活动类型"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
    </div>
  </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.PlayerAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
</template>
