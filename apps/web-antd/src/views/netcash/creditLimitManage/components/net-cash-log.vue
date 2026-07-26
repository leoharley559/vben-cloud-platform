<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Pagination,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { getNetCashLogListApi } from '#/api/netcash/credit-limit';
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
const summary = reactive({
  TotalAdjustAmount: 0,
  TotalAfterAdjustAmount: 0,
  TotalBeforeAdjustAmount: 0,
});
const transferRange = ref<DateRange>();
const query = reactive({
  AccountType: '',
  AgentAccount: '',
  Page: 1,
  PageSize: 20,
});
const columns = [
  { key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'AdminAccount', key: 'AdminAccount', title: '代理账号' },
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
  { dataIndex: 'UpdateTime', key: 'UpdateTime', title: '账变时间', width: 180 },
  { dataIndex: 'AdjustAmount', key: 'AdjustAmount', title: '变更金额（元）' },
  { dataIndex: 'AdjustAmountBef', key: 'AdjustAmountBef', title: '变更前额度（元）' },
  { dataIndex: 'AdjustAmountAft', key: 'AdjustAmountAft', title: '变更后额度（元）' },
  { dataIndex: 'ReviewNote', key: 'ReviewNote', title: '备注' },
];

const summaryItems = computed(() => [
  { label: '变更金额合计', value: amount(summary.TotalAdjustAmount) },
  { label: '变更前额度合计', value: amount(summary.TotalBeforeAdjustAmount) },
  { label: '变更后额度合计', value: amount(summary.TotalAfterAdjustAmount) },
]);

function buildQuery() {
  return {
    AccountType: query.AccountType,
    AdminAccount: query.AgentAccount,
    AgentType: 2,
    Page: query.Page,
    PageSize: query.PageSize,
    TransferType: 3,
    WalletType: 2,
    ...rangeParams(transferRange.value, 'TransferStartTime', 'TransferEndTime'),
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await getNetCashLogListApi(buildQuery());
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
    summary.TotalAdjustAmount = Number(result.Total?.TotalAdjustAmount || 0);
    summary.TotalBeforeAdjustAmount = Number(
      result.Total?.TotalBeforeAdjustAmount || 0,
    );
    summary.TotalAfterAdjustAmount = Number(
      result.Total?.TotalAfterAdjustAmount || 0,
    );
  } catch {
    rows.value = [];
    total.value = 0;
    summary.TotalAdjustAmount = 0;
    summary.TotalBeforeAdjustAmount = 0;
    summary.TotalAfterAdjustAmount = 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.Page = 1;
  void load();
}

function reset() {
  Object.assign(query, { AccountType: '', AgentAccount: '', Page: 1 });
  transferRange.value = undefined;
  void load();
}

onMounted(load);
</script>

<template>
  <div>
    <Space class="mb-4" wrap>
      <Input v-model:value="query.AgentAccount" allow-clear placeholder="代理账号" @press-enter="search" style="width: 220px">
        <template #addonBefore>代理账号</template>
      </Input>
      <Select v-model:value="query.AccountType" :options="accountTypeOptions" placeholder="代理类型" style="width: 150px" />
      <DatePicker.RangePicker v-model:value="transferRange" />
      <Button type="primary" @click="search">查询</Button>
      <Button @click="reset">重置</Button>
    </Space>
    <SummaryCards :items="summaryItems" />
    <Table :columns="columns" :data-source="rows" :loading="loading" :pagination="false" row-key="Id" :scroll="{ x: 1250 }" size="small">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ (query.Page - 1) * query.PageSize + index + 1 }}</template>
        <template v-else-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
        <template v-else-if="column.key === 'UpdateTime'">{{ date(record.UpdateTime) }}</template>
        <template v-else-if="['AdjustAmount', 'AdjustAmountBef', 'AdjustAmountAft'].includes(String(column.key))"><span :class="column.key === 'AdjustAmount' && Number(record.AdjustAmount) < 0 ? 'text-red-500' : ''">{{ amount(record[String(column.key)]) }}</span></template>
      </template>
    </Table>
    <Pagination v-if="total" v-model:current="query.Page" v-model:page-size="query.PageSize" :page-size-options="['10', '20', '50', '100']" :total="total" class="mt-4 text-right" show-size-changer @change="load" @show-size-change="load" />
  </div>
</template>
