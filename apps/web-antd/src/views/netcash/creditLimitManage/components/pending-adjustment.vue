<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  approveCreditLimitApi,
  getAgentCreditLimitApi,
  getCreditLimitApplyRecordListApi,
  rejectCreditLimitApi,
} from '#/api/netcash/credit-limit';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { createRequestHash } from '#/utils/crypto';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

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
  unwrapCreditLimitItem,
} from './shared';

const { checkPermission } = useCloudPermission();
const canApprove = computed(() => checkPermission(11_756));
const canReject = computed(() => checkPermission(11_757));
const loading = ref(false);
const rows = ref<Row[]>([]);
const total = ref(0);
const totalAmount = ref(0);
const platformCredit = ref(0);
const selectedKeys = ref<Array<number | string>>([]);
const applyRange = ref<DateRange>();
const query = reactive({
  AccountType: '',
  AgentAccount: '',
  ApplyAccount: '',
  Page: 1,
  PageSize: 20,
  TransferType: '3,8',
});
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
  { key: 'actions', title: '操作', width: 140 },
];

const summaryItems = computed(() => [
  { label: '申请金额合计', value: amount(totalAmount.value) },
]);

function canReview(row: Row) {
  return !isSameAcctActionRestricted(
    23,
    row.CreateAdminId as number | string,
  );
}

const rowSelection = computed(() => ({
  getCheckboxProps: (record: Row) => ({ disabled: !canReview(record) }),
  onChange: (keys: Array<number | string>) => {
    selectedKeys.value = keys;
  },
  selectedRowKeys: selectedKeys.value,
}));

function buildQuery() {
  return {
    ...query,
    AgentType: 2,
    Status: 1,
    ...rangeParams(applyRange.value, 'BeginApplyTime', 'EndApplyTime'),
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await getCreditLimitApplyRecordListApi(buildQuery());
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
    totalAmount.value = Number(result.Total?.TotalAdjustAmount || 0);
    selectedKeys.value = [];
  } catch {
    rows.value = [];
    total.value = 0;
    totalAmount.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadPlatformCredit() {
  try {
    const result = await getAgentCreditLimitApi({});
    const item = unwrapCreditLimitItem(result);
    platformCredit.value = Number(item.Credit || 0);
  } catch {
    platformCredit.value = 0;
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
    Page: 1,
    TransferType: '3,8',
  });
  applyRange.value = undefined;
  void load();
}

const reviewOpen = ref(false);
const reviewSubmitting = ref(false);
const approving = ref(true);
const reviewRows = ref<Row[]>([]);
const finishNote = ref('');

function openReview(items: Row[], approve: boolean) {
  const allowed = items.filter((item) => canReview(item));
  if (allowed.length === 0) {
    message.warning('没有可审核的数据');
    return;
  }
  reviewRows.value = allowed;
  approving.value = approve;
  finishNote.value = '';
  reviewOpen.value = true;
}

function batchReview(approve: boolean) {
  openReview(
    rows.value.filter((row) => selectedKeys.value.includes(row.Id)),
    approve,
  );
}

async function submitReview() {
  reviewSubmitting.value = true;
  try {
    const api = approving.value ? approveCreditLimitApi : rejectCreditLimitApi;
    await api({
      FinishNote: finishNote.value,
      Hash: createRequestHash(),
      Ids: reviewRows.value.map((row) => row.Id).join(','),
    });
    message.success('审核成功');
    reviewOpen.value = false;
    await Promise.all([load(), loadPlatformCredit()]);
  } catch {
    message.error('审核失败，请稍后重试');
  } finally {
    reviewSubmitting.value = false;
  }
}

onMounted(() => Promise.all([load(), loadPlatformCredit()]));
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
      <Tag color="blue">平台可用额度：{{ amount(platformCredit) }}</Tag>
      <Button @click="loadPlatformCredit">刷新额度</Button>
      <Input v-model:value="query.AgentAccount" allow-clear placeholder="代理账号" @press-enter="search" style="width: 220px">
        <template #addonBefore>代理账号</template>
      </Input>
      <Select v-model:value="query.AccountType" :options="accountTypeOptions" placeholder="代理类型" style="width: 150px" />
      <Select v-model:value="query.TransferType" :options="transferTypeOptions" placeholder="申请类型" style="width: 150px" />
      <Input v-model:value="query.ApplyAccount" allow-clear placeholder="申请人" style="width: 210px">
        <template #addonBefore>申请人</template>
      </Input>
      <DatePicker.RangePicker v-model:value="applyRange" />
      <Button type="primary" @click="search">查询</Button>
      <Button @click="reset">重置</Button>
      <Button v-if="canApprove" :disabled="selectedKeys.length === 0" type="primary" @click="batchReview(true)">批量通过</Button>
      <Button v-if="canReject" :disabled="selectedKeys.length === 0" danger @click="batchReview(false)">批量拒绝</Button>
    </div>

    <SummaryCards :items="summaryItems" />
    <Table :columns="columns" :data-source="rows" :loading="loading" :pagination="false" :row-selection="canApprove || canReject ? rowSelection : undefined" row-key="Id" :scroll="{ x: 1350 }" size="small">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ (query.Page - 1) * query.PageSize + index + 1 }}</template>
        <template v-else-if="column.key === 'AgentAccount'">
          <AgencyAccountLink
            :admin-id="resolveAgencyAdminId(record)"
            :username="record.AgentAccount"
          />
        </template>
        <template v-else-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
        <template v-else-if="column.key === 'TransferType'">{{ transferTypeMap[Number(record.TransferType)] || '-' }}</template>
        <template v-else-if="column.key === 'AdjustAmount'"><span :class="Number(record.AdjustAmount) < 0 ? 'text-red-500' : 'text-green-600'">{{ amount(record.AdjustAmount) }}</span></template>
        <template v-else-if="column.key === 'ApplyTime'">{{ date(record.ApplyTime) }}</template>
        <template v-else-if="column.key === 'actions'">
          <Button v-if="canApprove" :disabled="!canReview(record)" size="small" type="link" @click="openReview([record], true)">通过</Button>
          <Button v-if="canReject" :disabled="!canReview(record)" danger size="small" type="link" @click="openReview([record], false)">拒绝</Button>
        </template>
      </template>
    </Table>
    <Pagination v-if="total" v-model:current="query.Page" v-model:page-size="query.PageSize" :page-size-options="['10', '20', '50', '100']" :total="total" class="mt-4 text-right" show-size-changer @change="load" @show-size-change="load" />

    <Modal v-model:open="reviewOpen" :confirm-loading="reviewSubmitting" :title="approving ? '通过额度申请' : '拒绝额度申请'" @ok="submitReview">
      <Form layout="vertical">
        <Form.Item v-if="reviewRows.length === 1" label="代理账号"><Input :value="String(reviewRows[0]?.AgentAccount || '')" disabled /></Form.Item>
        <Form.Item v-if="reviewRows.length === 1" label="申请金额（元）"><Input :value="amount(reviewRows[0]?.AdjustAmount)" disabled /></Form.Item>
        <Form.Item v-else label="审核数量"><Input :value="String(reviewRows.length)" disabled /></Form.Item>
        <Form.Item label="审核备注"><Input.TextArea v-model:value="finishNote" :maxlength="100" :rows="4" /></Form.Item>
      </Form>
    </Modal>
  </div>
</template>
