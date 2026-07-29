<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Pagination,
  Select,
  Table,
} from 'ant-design-vue';

import { fetchDebtListApi } from '#/api/netcash/credit-limit';
import SummaryCards from '#/components/global/summary-cards.vue';

import {
  accountTypeMap,
  accountTypeOptions,
  amount,
  date,
  type DateRange,
  rangeParams,
  type Row,
} from './shared';

const loading = ref(false);
const rows = ref<Row[]>([]);
const total = ref(0);
const totalAmount = ref(0);
const timeRange = ref<DateRange>();
const debtTypeOptions = [
  { label: '全部', value: '8,9' },
  { label: '手动还款', value: 8 },
  { label: '佣金发放抵扣', value: 9 },
];
const debtTypeMap: Record<number, string> = {
  8: '手动还款',
  9: '佣金发放抵扣',
};
const query = reactive({
  AgentAccounts: '',
  Page: 1,
  PageSize: 20,
  TransferType: '8,9',
  Type: '',
});
const columns = [
  { key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'AgentAccount', key: 'AgentAccount', title: '代理账号' },
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
  { dataIndex: 'TransferType', key: 'TransferType', title: '还款类型' },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '还款时间', width: 180 },
  { dataIndex: 'AdjustAmount', key: 'AdjustAmount', title: '还款金额（元）' },
  { dataIndex: 'AdjustAmountBef', key: 'AdjustAmountBef', title: '还款前欠款（元）' },
  { dataIndex: 'AdjustAmountAft', key: 'AdjustAmountAft', title: '还款后欠款（元）' },
  { dataIndex: 'ReviewNote', key: 'ReviewNote', title: '备注' },
];

const summaryItems = computed(() => [
  { label: '还款金额合计', value: amount(totalAmount.value) },
]);

function buildQuery() {
  return {
    ...query,
    ...rangeParams(timeRange.value, 'BeginTime', 'EndTime'),
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await fetchDebtListApi(buildQuery());
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
    totalAmount.value = Number(result.Total?.TotalAdjustAmount || 0);
  } catch {
    rows.value = [];
    total.value = 0;
    totalAmount.value = 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.Page = 1;
  void load();
}

function reset() {
  Object.assign(query, {
    AgentAccounts: '',
    Page: 1,
    TransferType: '8,9',
    Type: '',
  });
  timeRange.value = undefined;
  void load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
      <Input v-model:value="query.AgentAccounts" allow-clear placeholder="代理账号" @press-enter="search" style="width: 220px">
        <template #addonBefore>代理账号</template>
      </Input>
      <Select v-model:value="query.Type" :options="accountTypeOptions" placeholder="代理类型" style="width: 150px" />
      <Select v-model:value="query.TransferType" :options="debtTypeOptions" placeholder="还款类型" style="width: 180px" />
      <DatePicker.RangePicker v-model:value="timeRange" />
      <Button type="primary" @click="search">查询</Button>
      <Button @click="reset">重置</Button>
    </div>
    <SummaryCards :items="summaryItems" />
    <Table :columns="columns" :data-source="rows" :loading="loading" :pagination="false" row-key="Id" :scroll="{ x: 1400 }" size="small">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ (query.Page - 1) * query.PageSize + index + 1 }}</template>
        <template v-else-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
        <template v-else-if="column.key === 'TransferType'">{{ debtTypeMap[Number(record.TransferType)] || '-' }}</template>
        <template v-else-if="column.key === 'CreateTime'">{{ date(record.CreateTime) }}</template>
        <template v-else-if="column.key === 'AdjustAmount'">{{ amount(Math.abs(Number(record.AdjustAmount))) }}</template>
        <template v-else-if="column.key === 'AdjustAmountBef' || column.key === 'AdjustAmountAft'">{{ amount(record[column.key]) }}</template>
      </template>
    </Table>
    <Pagination v-if="total" v-model:current="query.Page" v-model:page-size="query.PageSize" :page-size-options="['10', '20', '50', '100']" :total="total" class="mt-4 text-right" show-size-changer @change="load" @show-size-change="load" />
  </div>
</template>
