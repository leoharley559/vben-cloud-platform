<script lang="ts" setup>
import type { DateRange, Row } from './shared';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  applyCreditLimitApi,
  editCreditLimitApi,
  getAgentCreditLimitApi,
  getNetCashAccountListApi,
} from '#/api/netcash/credit-limit';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

import { accountTypeMap, accountTypeOptions, amount, date, exportRows, rangeParams, unwrapCreditLimitItem } from './shared';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

const { checkPermission } = useCloudPermission();
const loading = ref(false);
const exporting = ref(false);
const rows = ref<Row[]>([]);
const total = ref(0);
const summary = reactive({ CreditDue: 0, TotalCredit: 0 });
const agentCreateRange = ref<DateRange>();
const query = reactive({
  AccountTypes: [1, 2, 3] as number[],
  AgentAccount: '',
  BeginCreditRange: undefined as number | undefined,
  EndCreditRange: undefined as number | undefined,
  Page: 1,
  PageSize: 20,
});

const agentModelMap: Record<number, string> = {
  1: '单层',
  2: '多层单返',
  3: '多层多返',
};
const settlementMap: Record<number, string> = {
  1: '日结',
  2: '周结',
  3: '月结',
};
const columns = [
  { key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'AgentAccount', key: 'AgentAccount', title: '代理账号' },
  { dataIndex: 'Type', key: 'Type', title: '代理类型' },
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理模式' },
  { dataIndex: 'SettlementType', key: 'SettlementType', title: '佣金周期' },
  {
    dataIndex: 'AgentCreateTime',
    key: 'AgentCreateTime',
    title: '成为代理时间',
    width: 180,
  },
  { dataIndex: 'Credit', key: 'Credit', title: '剩余额度（元）' },
  { dataIndex: 'CreditDue', key: 'CreditDue', title: '代充欠款（元）' },
  { key: 'actions', title: '操作', width: 150 },
];
const exportColumns = [
  { field: 'AgentAccount', title: '代理账号' },
  {
    field: 'Type',
    formatter: (value: unknown) => accountTypeMap[Number(value)] || '-',
    title: '代理类型',
  },
  {
    field: 'AccountType',
    formatter: (value: unknown) => agentModelMap[Number(value)] || '-',
    title: '代理模式',
  },
  {
    field: 'SettlementType',
    formatter: (value: unknown) => settlementMap[Number(value)] || '-',
    title: '佣金周期',
  },
  { field: 'AgentCreateTime', formatter: date, title: '成为代理时间' },
  { field: 'Credit', formatter: amount, title: '剩余额度（元）' },
  { field: 'CreditDue', formatter: amount, title: '代充欠款（元）' },
];

const summaryItems = computed(() => [
  { label: '总剩余额度', value: amount(summary.TotalCredit) },
  { label: '总代充欠款', value: amount(summary.CreditDue) },
]);

function buildQuery(page = query.Page, pageSize = query.PageSize) {
  return {
    AccountTypes:
      query.AccountTypes.length > 0 ? query.AccountTypes.join(',') : '1,2,3',
    AgentAccount: query.AgentAccount,
    BeginCreditRange:
      query.BeginCreditRange === undefined
        ? 0
        : Math.round(query.BeginCreditRange * 100),
    EndCreditRange:
      query.EndCreditRange === undefined
        ? 0
        : Math.round(query.EndCreditRange * 100),
    Page: page,
    PageSize: pageSize,
    ...rangeParams(
      agentCreateRange.value,
      'BeginAgentCreateTime',
      'EndAgentCreateTime',
    ),
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await getNetCashAccountListApi(buildQuery());
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
    summary.TotalCredit = Number(result.Total?.TotalCredit || 0);
    summary.CreditDue = Number(result.Total?.CreditDue || 0);
  } catch {
    rows.value = [];
    total.value = 0;
    summary.TotalCredit = 0;
    summary.CreditDue = 0;
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
    AccountTypes: [1, 2, 3],
    AgentAccount: '',
    BeginCreditRange: undefined,
    EndCreditRange: undefined,
    Page: 1,
  });
  agentCreateRange.value = undefined;
  void load();
}

async function handleExport() {
  exporting.value = true;
  try {
    const result = await getNetCashAccountListApi({
      ...buildQuery(1, Math.max(total.value + 1, 1000)),
      IsExp: true,
    });
    if (
      !(await exportRows('代理额度管理', exportColumns, result.Items || []))
    ) {
      message.info('暂无可导出数据');
    }
  } catch {
    message.error('导出失败，请稍后重试');
  } finally {
    exporting.value = false;
  }
}

const adjustOpen = ref(false);
const adjustSubmitting = ref(false);
const adjustForm = reactive({
  AdjustAmount: undefined as number | undefined,
  AgentAccounts: '',
  ApplyNote: '',
  CreditDue: 0,
  CurrentCredit: 0,
  TransferType: 3,
  mode: 'adjust' as 'adjust' | 'batch' | 'receipt',
});

function openAdjust(row?: Row, mode: typeof adjustForm.mode = 'batch') {
  Object.assign(adjustForm, {
    AdjustAmount: undefined,
    AgentAccounts: row?.AgentAccount ? String(row.AgentAccount) : '',
    ApplyNote: '',
    CreditDue: Number(row?.CreditDue || 0) / 100,
    CurrentCredit: Number(row?.Credit || 0) / 100,
    TransferType: mode === 'receipt' ? 8 : 3,
    mode,
  });
  adjustOpen.value = true;
}

async function submitAdjust() {
  const accounts = adjustForm.AgentAccounts.replaceAll('，', ',').trim();
  if (!accounts || !/^[\w,]+$/.test(accounts)) {
    message.warning('请输入以英文逗号分隔的代理账号');
    return;
  }
  if (!adjustForm.AdjustAmount || !Number.isFinite(adjustForm.AdjustAmount)) {
    message.warning('请输入非零且最多两位小数的金额');
    return;
  }
  if (
    adjustForm.TransferType === 8 &&
    (adjustForm.AdjustAmount <= 0 ||
      adjustForm.AdjustAmount > adjustForm.CreditDue)
  ) {
    message.warning('还款金额必须大于 0 且不能超过当前欠款');
    return;
  }
  adjustSubmitting.value = true;
  try {
    await applyCreditLimitApi({
      AdjustAmount: Math.round(adjustForm.AdjustAmount * 100),
      AgentAccounts: accounts,
      AgentType: 2,
      ApplyNote: adjustForm.ApplyNote,
      Hash: createRequestHash(),
      TransferType: adjustForm.TransferType,
      WalletType: 2,
    });
    message.success('提交成功');
    adjustOpen.value = false;
    await load();
  } catch {
    message.error('提交失败，请稍后重试');
  } finally {
    adjustSubmitting.value = false;
  }
}

const limitOpen = ref(false);
const limitSubmitting = ref(false);
const limitForm = reactive({
  DailyTransferAmount: 0,
  MaxTransferAmount: 0,
  MinTransferAmount: 0,
});

async function openTransferLimit() {
  loading.value = true;
  try {
    // 对齐旧站：无分页参数
    const result = await getAgentCreditLimitApi({});
    const item = unwrapCreditLimitItem(result);
    limitForm.MinTransferAmount = Number(item.MinTransferAmount || 0) / 100;
    limitForm.MaxTransferAmount = Number(item.MaxTransferAmount || 0) / 100;
    limitForm.DailyTransferAmount = Number(item.DailyTransferAmount || 0) / 100;
    limitOpen.value = true;
  } catch {
    message.error('无法读取转账限额');
  } finally {
    loading.value = false;
  }
}

async function submitTransferLimit() {
  if (
    limitForm.MinTransferAmount < 0 ||
    limitForm.MaxTransferAmount <= limitForm.MinTransferAmount ||
    limitForm.DailyTransferAmount < 0
  ) {
    message.warning('最低单笔金额须小于最高单笔金额，且各额度不能为负数');
    return;
  }
  limitSubmitting.value = true;
  try {
    await editCreditLimitApi({
      DailyTransferAmount: Math.round(limitForm.DailyTransferAmount * 100),
      Hash: createRequestHash(),
      MaxTransferAmount: Math.round(limitForm.MaxTransferAmount * 100),
      MinTransferAmount: Math.round(limitForm.MinTransferAmount * 100),
    });
    message.success('设置成功');
    limitOpen.value = false;
    await load();
  } catch {
    message.error('设置失败，请稍后重试');
  } finally {
    limitSubmitting.value = false;
  }
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
        <div class="query-filter-wide">
          <Space.Compact>
            <span class="query-field-addon">代理类型</span>
            <Select
              v-model:value="query.AccountTypes"
              :options="accountTypeOptions.slice(1)"
              mode="multiple"
              placeholder="请选择代理类型"
            />
          </Space.Compact>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="agentCreateRange" />
        </div>
        <Space.Compact>
          <span class="query-field-addon">额度</span>
          <InputNumber
            v-model:value="query.BeginCreditRange"
            :min="0"
            :precision="2"
            placeholder="请输入起"
          />
          <InputNumber
            v-model:value="query.EndCreditRange"
            :min="0"
            :precision="2"
            placeholder="请输入止"
          />
        </Space.Compact>
        <div class="query-filter-actions">
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
          <Button
            v-if="checkPermission(11_802)"
            :loading="exporting"
            @click="handleExport"
            >
导出 Excel
</Button>
          <Button v-if="checkPermission(11_753)" @click="openTransferLimit">
转账限额设置
</Button>
          <Button
            v-if="checkPermission(11_754)"
            type="primary"
            @click="openAdjust()"
            >
批量调整代理
</Button>
        </div>
      </div>
    </div>

    <SummaryCards :items="summaryItems" />

    <Table
      bordered
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="AgentAccount"
      :scroll="{ x: 1200 }"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">
{{
          (query.Page - 1) * query.PageSize + index + 1
        }}
</template>
        <template v-else-if="column.key === 'Type'">
{{
          accountTypeMap[Number(record.Type)] || '-'
        }}
</template>
        <template v-else-if="column.key === 'AccountType'">
{{
          agentModelMap[Number(record.AccountType)] || '-'
        }}
</template>
        <template v-else-if="column.key === 'SettlementType'">
{{
          settlementMap[Number(record.SettlementType)] || '-'
        }}
</template>
        <template v-else-if="column.key === 'AgentCreateTime'">
{{
          date(record.AgentCreateTime)
        }}
</template>
        <template
          v-else-if="column.key === 'Credit' || column.key === 'CreditDue'"
          >
{{ amount(record[column.key]) }}
</template>
        <template v-else-if="column.key === 'actions'">
          <Button
            :disabled="Number(record.Type) === 3"
            size="small"
            type="link"
            @click="openAdjust(record, 'adjust')"
            >
调整
</Button>
          <Button
            :disabled="
              Number(record.Type) === 3 || Number(record.CreditDue) <= 0
            "
            size="small"
            type="link"
            @click="openAdjust(record, 'receipt')"
            >
还款
</Button>
        </template>
      </template>
    </Table>
    <Pagination
      v-if="total"
      v-model:current="query.Page"
      v-model:page-size="query.PageSize"
      :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
      :total="total"
      class="mt-4 text-right"
      show-size-changer
      @change="load"
      @show-size-change="load"
    />

    <Modal
      v-model:open="adjustOpen"
      :confirm-loading="adjustSubmitting"
      :title="
        adjustForm.mode === 'receipt'
          ? '代充还款'
          : adjustForm.mode === 'batch'
            ? '批量调整代理'
            : '调整代理额度'
      "
      @ok="submitAdjust"
    >
      <Form layout="vertical">
        <Form.Item label="代理账号（多个用英文逗号分隔）" required>
<Input
            v-model:value="adjustForm.AgentAccounts"
            :disabled="adjustForm.mode !== 'batch'"
        />
</Form.Item>
        <Form.Item v-if="adjustForm.mode === 'adjust'" label="当前额度（元）">
<Input :value="adjustForm.CurrentCredit.toFixed(2)" disabled />
</Form.Item>
        <Form.Item v-if="adjustForm.mode === 'batch'" label="类型">
<Select
            v-model:value="adjustForm.TransferType"
            :options="[
              { label: '调整', value: 3 },
              { label: '还款', value: 8 },
            ]"
        />
</Form.Item>
        <Form.Item
          :label="
            adjustForm.TransferType === 8 ? '还款金额（元）' : '调整金额（元）'
          "
          required
        >
          <InputNumber
            v-model:value="adjustForm.AdjustAmount"
            :max="
              adjustForm.TransferType === 8 ? adjustForm.CreditDue : undefined
            "
            :min="adjustForm.TransferType === 8 ? 0.01 : undefined"
            :precision="2"
            class="w-full"
            :placeholder="
              adjustForm.TransferType === 3
                ? '正数增加，负数扣除'
                : '请输入还款金额'
            "
          />
        </Form.Item>
        <Form.Item label="申请备注">
<Input.TextArea
            v-model:value="adjustForm.ApplyNote"
            :maxlength="100"
            :rows="4"
        />
</Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="limitOpen"
      :confirm-loading="limitSubmitting"
      title="转账限额设置"
      @ok="submitTransferLimit"
    >
      <Form layout="vertical">
        <Form.Item label="最低单笔金额（元）" required>
<InputNumber
            v-model:value="limitForm.MinTransferAmount"
            :min="0"
            :precision="2"
            class="w-full"
        />
</Form.Item>
        <Form.Item label="最高单笔金额（元）" required>
<InputNumber
            v-model:value="limitForm.MaxTransferAmount"
            :min="0"
            :precision="2"
            class="w-full"
        />
</Form.Item>
        <Form.Item label="每日转账额度（元）" required>
<InputNumber
            v-model:value="limitForm.DailyTransferAmount"
            :min="0"
            :precision="2"
            class="w-full"
        />
</Form.Item>
      </Form>
    </Modal>
  </div>
</template>
