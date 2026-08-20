<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerAgentReportApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
    {
      field: 'LoginAccount',
      minWidth: 120,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
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
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterOrderId"
            allow-clear
            placeholder="请输入订单号"
          >
            <template #addonBefore>订单号</template>
          </Input>
        </div>
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
        <Space.Compact>
          <span class="query-field-addon">代理模式</span>
          <Select
            v-model:value="filterMode"
            :options="modeOptions"
            placeholder="请选择代理模式"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="finishTimeRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
      </div>
    </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
</template>
