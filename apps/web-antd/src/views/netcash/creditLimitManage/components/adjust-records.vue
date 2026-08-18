<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Input,
  Pagination,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { getCreditLimitApplyRecordListApi } from '#/api/netcash/credit-limit';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { CREDIT_APPROVE_STATUS_MAP } from '#/utils/netcash';

import {
  accountTypeMap,
  accountTypeOptions,
  amount,
  date,
  type DateRange,
  rangeParams,
  type Row,
  transferTypeMap,
  transferTypeOptions,
} from './shared';

const loading = ref(false);
const rows = ref<Row[]>([]);
const total = ref(0);
const totalAmount = ref(0);
const applyRange = ref<DateRange>();
const finishRange = ref<DateRange>();
const query = reactive({
  AccountType: '',
  AgentAccount: '',
  ApplyAccount: '',
  FinishAccount: '',
  Page: 1,
  PageSize: 20,
  Status: '-1',
  TransferType: '3,8',
});
const statusOptions = [
  { label: '全部', value: '-1' },
  { label: '待审核', value: 1 },
  { label: '通过', value: 2 },
  { label: '拒绝', value: 3 },
];
const columns = [
  { key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'AgentAccount', key: 'AgentAccount', title: '代理账号' },
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
  { dataIndex: 'TransferType', key: 'TransferType', title: '申请类型' },
  { dataIndex: 'AdjustAmount', key: 'AdjustAmount', title: '申请金额（元）' },
  { dataIndex: 'ApplyTime', key: 'ApplyTime', title: '申请时间', width: 180 },
  { dataIndex: 'ApplyAccount', key: 'ApplyAccount', title: '申请人' },
  { dataIndex: 'ApplyNote', key: 'ApplyNote', title: '申请备注' },
  { dataIndex: 'FinishTime', key: 'FinishTime', title: '审核时间', width: 180 },
  { dataIndex: 'FinishAccount', key: 'FinishAccount', title: '审核人' },
  { dataIndex: 'FinishNote', key: 'FinishNote', title: '审核备注' },
  { dataIndex: 'Status', key: 'Status', title: '状态' },
];

const summaryItems = computed(() => [
  { label: '调整金额合计', value: amount(totalAmount.value) },
]);

function buildQuery() {
  return {
    ...query,
    AgentType: 2,
    ...rangeParams(applyRange.value, 'BeginApplyTime', 'EndApplyTime'),
    ...rangeParams(finishRange.value, 'BeginFinishTime', 'EndFinishTime'),
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await getCreditLimitApplyRecordListApi(buildQuery());
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
    AccountType: '',
    AgentAccount: '',
    ApplyAccount: '',
    FinishAccount: '',
    Page: 1,
    Status: '-1',
    TransferType: '3,8',
  });
  applyRange.value = undefined;
  finishRange.value = undefined;
  void load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="query.AgentAccount"
          allow-clear
          @press-enter="search"
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">代理类型</span>
        <Select v-model:value="query.AccountType" :options="accountTypeOptions" placeholder="请选择代理类型" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">申请类型</span>
        <Select v-model:value="query.TransferType" :options="transferTypeOptions" placeholder="请选择申请类型" />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="query.ApplyAccount"
          allow-clear
          placeholder="请输入申请人"
        >
          <template #addonBefore>申请人</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="applyRange" />
        </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="query.FinishAccount"
          allow-clear
          placeholder="请输入审核人"
        >
          <template #addonBefore>审核人</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">审核结果</span>
        <Select v-model:value="query.Status" :options="statusOptions" placeholder="请选择审核结果" />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="finishRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="search">查询</Button>
      <Button @click="reset">重置</Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />
    <Table :columns="columns" :data-source="rows" :loading="loading" :pagination="false" row-key="Id" :scroll="{ x: 1850 }" size="small">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ (query.Page - 1) * query.PageSize + index + 1 }}</template>
        <template v-else-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
        <template v-else-if="column.key === 'TransferType'">{{ transferTypeMap[Number(record.TransferType)] || '-' }}</template>
        <template v-else-if="column.key === 'AdjustAmount'"><span :class="Number(record.AdjustAmount) < 0 ? 'text-red-500' : 'text-green-600'">{{ amount(record.AdjustAmount) }}</span></template>
        <template v-else-if="column.key === 'ApplyTime' || column.key === 'FinishTime'">{{ date(record[column.key]) }}</template>
        <template v-else-if="column.key === 'Status'"><span :class="Number(record.Status) === 2 ? 'text-green-600' : Number(record.Status) === 3 ? 'text-red-500' : ''">{{ CREDIT_APPROVE_STATUS_MAP[Number(record.Status)] || '-' }}</span></template>
      </template>
    </Table>
    <Pagination v-if="total" v-model:current="query.Page" v-model:page-size="query.PageSize" :page-size-options="['10', '20', '50', '100']" :total="total" class="mt-4 text-right" show-size-changer @change="load" @show-size-change="load" />
  </div>
</template>
