<script lang="ts" setup>
import type { CreditPanelConfig } from '../credit-components/credit-data-panel.vue';

import type {
  PlatformCreditApplyPayload,
  PlatformCreditApplyRecordQuery,
  PlatformNetCashLogQuery,
} from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tabs,
} from 'ant-design-vue';

import {
  applyPlatformCreditApi,
  approvePlatformCreditAdjustmentApi,
  getPlatformAgentCreditLimitApi,
  getPlatformCreditLimitApplyRecordListApi,
  getPlatformNetCashLogListApi,
  rejectPlatformCreditAdjustmentApi,
} from '#/api/netcash/credit-limit-platform';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import CreditDataPanel from '../credit-components/credit-data-panel.vue';
import { unwrapCreditLimitItem } from '../creditLimitManage/components/shared';

defineOptions({ name: 'CreditLimitPlatformManage' });

const { checkPermission } = useCloudPermission();
const canApply = computed(() => checkPermission(11_793));
const canApprove = computed(() => checkPermission(11_796));
const canReject = computed(() => checkPermission(11_797));
const panelRefs = reactive<Record<string, InstanceType<typeof CreditDataPanel>>>({});
const amount = (value: unknown) => formatAmountFromCent(Number(value || 0));
const date = (value: unknown) => formatNetcashDateTime(value as string);
const walletMap: Record<number, string> = { 2: '代存', 3: '代客' };

const commonFilters = [
  {
    field: 'WalletType',
    label: '调整类型',
    options: [
      { label: '全部', value: '' },
      { label: '代存', value: 2 },
      { label: '代客', value: 3 },
    ],
    type: 'select' as const,
  },
  {
    field: 'AdjustType',
    label: '调整方式',
    options: [
      { label: '全部', value: '' },
      { label: '增加', value: 1 },
      { label: '扣除', value: 2 },
    ],
    type: 'select' as const,
  },
  {
    fields: ['BeginApplyTime', 'EndApplyTime'] as [string, string],
    label: '申请时间',
    type: 'dateRange' as const,
  },
];
const commonColumns = [
  { field: 'OrderId', title: '订单号' },
  {
    field: 'WalletType',
    formatter: (value: unknown) => walletMap[Number(value)] || '未知',
    title: '调整类型',
  },
  {
    field: 'AdjustAmount',
    formatter: (value: unknown) => (Number(value) >= 0 ? '增加' : '扣除'),
    title: '调整方式',
  },
  { field: 'AdjustAmount', formatter: amount, title: '调整金额（元）' },
  { field: 'ApplyAccount', title: '申请人' },
  { field: 'ApplyTime', formatter: date, minWidth: 165, title: '申请时间' },
];

const pendingConfig: CreditPanelConfig = {
  actionWidth: 150,
  baseQuery: { AgentType: 1, Status: 1 },
  columns: commonColumns,
  fetchApi: (query) =>
    getPlatformCreditLimitApplyRecordListApi(
      query as PlatformCreditApplyRecordQuery,
    ),
  filters: commonFilters,
  showActions: true,
  summaries: [{ amount: true, field: 'TotalAdjustAmount', label: '申请金额合计' }],
};
const recordConfig: CreditPanelConfig = {
  // Status 空串=全部（含待审）；旧站把 全部 映射成 -1，后端 -1 实测恒空
  baseQuery: { AgentType: 1, Status: '' },
  columns: [
    ...commonColumns,
    { field: 'FinishAccount', title: '审核人' },
    { field: 'FinishTime', formatter: date, minWidth: 165, title: '审核时间' },
    {
      field: 'Status',
      formatter: (value: unknown) =>
        CREDIT_APPROVE_STATUS_MAP[Number(value)] || '-',
      title: '状态',
    },
  ],
  fetchApi: (query) =>
    getPlatformCreditLimitApplyRecordListApi(
      query as PlatformCreditApplyRecordQuery,
    ),
  filters: [
    ...commonFilters,
    {
      defaultValue: '',
      field: 'Status',
      label: '状态',
      options: [
        { label: '全部', value: '' },
        { label: '待审核', value: 1 },
        { label: '通过', value: 2 },
        { label: '拒绝', value: 3 },
      ],
      type: 'select',
    },
  ],
  summaries: [{ amount: true, field: 'TotalAdjustAmount', label: '调整金额合计' }],
};
const logConfig: CreditPanelConfig = {
  baseQuery: { AgentType: 1, TransferType: 3, WalletType: 0 },
  columns: [
    { field: 'OrderId', title: '订单号' },
    { field: 'UpdateTime', formatter: date, minWidth: 165, title: '帐变时间' },
    {
      field: 'WalletType',
      formatter: (value) => walletMap[Number(value)] || '未知',
      title: '调整类型',
    },
    {
      field: 'AdjustAmount',
      formatter: (value) => (Number(value) >= 0 ? '增加' : '扣除'),
      title: '调整方式',
    },
    { field: 'AdjustAmount', formatter: amount, title: '调整金额（元）' },
    { field: 'AdjustAmountBef', formatter: amount, title: '调整前额度（元）' },
    { field: 'AdjustAmountAft', formatter: amount, title: '调整后额度（元）' },
    { field: 'ReviewNote', minWidth: 180, title: '备注' },
  ],
  fetchApi: (query) =>
    getPlatformNetCashLogListApi(query as PlatformNetCashLogQuery),
  filters: [
    {
      ...commonFilters[0]!,
      // 旧站帐变默认/重置 WalletType=0；筛选项空串不覆盖 baseQuery
      defaultValue: 0,
      options: [
        { label: '全部', value: 0 },
        { label: '代存', value: 2 },
        { label: '代客', value: 3 },
      ],
    },
    commonFilters[1]!,
    {
      fields: ['TransferStartTime', 'TransferEndTime'],
      label: '帐变时间',
      type: 'dateRange',
    },
  ],
  summaries: [
    { amount: true, field: 'TotalAdjustAmount', label: '调整金额合计' },
    {
      amount: true,
      field: 'TotalBeforeAdjustAmount',
      label: '调整前额度合计',
    },
    {
      amount: true,
      field: 'TotalAfterAdjustAmount',
      label: '调整后额度合计',
    },
  ],
};

const tabs = computed(() =>
  [
    { inner: 11_792, key: 'apply', outer: 11_792, tab: '平台额度申请' },
    { config: pendingConfig, inner: 11_795, key: 'pending', outer: 11_794, tab: '平台额度审核' },
    { config: recordConfig, inner: 11_799, key: 'record', outer: 11_798, tab: '平台额度调整记录' },
    { config: logConfig, inner: 11_799, key: 'log', outer: 11_800, tab: '平台额度帐变记录' },
  ].filter((tab) => checkPermission(tab.outer)),
);
const activeTab = ref('apply');
const canViewPage = computed(() => tabs.value.length > 0);

const creditInfo = reactive({ Credit: 0, Dkcredit: 0 });
async function loadCreditInfo() {
  try {
    // 旧站 getAgentCreditLimit() 无分页参；respond.Items 为对象
    const result = await getPlatformAgentCreditLimitApi({});
    const item = unwrapCreditLimitItem(result);
    creditInfo.Credit = Number(item.Credit || 0);
    creditInfo.Dkcredit = Number(item.Dkcredit || 0);
  } catch {
    creditInfo.Credit = 0;
    creditInfo.Dkcredit = 0;
  }
}

const applyForm = reactive<{
  AdjustAmount?: number;
  AdjustType: 1 | 2;
  WalletType: 2 | 3;
}>({
  AdjustAmount: undefined as number | undefined,
  AdjustType: 1,
  WalletType: 2,
});
const applySubmitting = ref(false);
function resetApplyForm() {
  applyForm.AdjustAmount = undefined;
  applyForm.AdjustType = 1;
  applyForm.WalletType = 2;
}
function submitApply() {
  if (!applyForm.AdjustAmount || applyForm.AdjustAmount <= 0) {
    message.warning('请输入正确的调整金额');
    return;
  }
  const amountYuan = applyForm.AdjustAmount.toFixed(2);
  Modal.confirm({
    content: `确认申请${applyForm.AdjustType === 1 ? '增加' : '扣除'}额度：${amountYuan} 元？`,
    okText: '确认',
    title: '提示',
    onOk: async () => {
      applySubmitting.value = true;
      try {
        const cents = Math.round(Number(applyForm.AdjustAmount) * 100);
        const payload: PlatformCreditApplyPayload = {
          AdjustAmount: applyForm.AdjustType === 1 ? cents : -cents,
          Hash: createRequestHash(),
          WalletType: applyForm.WalletType,
        };
        await applyPlatformCreditApi(payload);
        message.success('申请成功');
        resetApplyForm();
        await loadCreditInfo();
      } catch {
        // 请求层已提示；保留表单便于重试
      } finally {
        applySubmitting.value = false;
      }
    },
  });
}

const reviewOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewApprove = ref(true);
const reviewRow = ref<Record<string, unknown>>();
const finishNote = ref('');
function openReview(row: Record<string, unknown>, approve: boolean) {
  reviewRow.value = row;
  reviewApprove.value = approve;
  finishNote.value = '';
  reviewOpen.value = true;
}
async function submitReview() {
  if (!reviewRow.value) return;
  reviewSubmitting.value = true;
  try {
    await (reviewApprove.value
      ? approvePlatformCreditAdjustmentApi
      : rejectPlatformCreditAdjustmentApi)({
      FinishNote: finishNote.value,
      Hash: createRequestHash(),
      Ids: String(reviewRow.value.Id),
    });
    message.success('审核成功');
    reviewOpen.value = false;
    panelRefs.pending?.reload();
    panelRefs.record?.reload();
    await loadCreditInfo();
  } catch {
    // 请求层已提示
  } finally {
    reviewSubmitting.value = false;
  }
}
function canReviewRow(row: Record<string, unknown>) {
  return !isSameAcctActionRestricted(23, row.CreateAdminId as number | string);
}

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'apply';
  // 旧站仅申请页拉取额度概览
  if (checkPermission(11_792)) void loadCreditInfo();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="完整迁移平台额度申请、审核、调整记录与帐变记录"
    title="平台额度管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" size="small" type="line">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <Result
            v-if="!checkPermission(item.inner)"
            status="403"
            sub-title="无此模块查看权限"
            title="403"
          />
          <div v-else-if="item.key === 'apply'">
            <div class="mb-6">
              <div class="mb-3 text-base font-medium">额度信息</div>
              <Descriptions
                bordered
                class="mb-2 max-w-md player-info-desc"
                :column="1"
                size="small"
                :label-style="{ width: '96px', whiteSpace: 'nowrap' }"
                :content-style="{ width: 'auto' }"
              >
                <Descriptions.Item label="代存额度">
                  {{ formatAmountFromCent(creditInfo.Credit) }}
                </Descriptions.Item>
                <Descriptions.Item label="代客额度">
                  {{ formatAmountFromCent(creditInfo.Dkcredit) }}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <div class="mb-3 text-base font-medium">额度申请</div>
              <Form
                class="max-w-xl"
                :label-col="{ span: 5 }"
                :wrapper-col="{ span: 16 }"
              >
                <Form.Item label="调整类型" required>
                  <Select
                    v-model:value="applyForm.WalletType"
                    :options="[
                      { label: '代存', value: 2 },
                      { label: '代客', value: 3 },
                    ]"
                    placeholder="请选择调整类型"
                  />
                </Form.Item>
                <Form.Item label="调整方式" required>
                  <Select
                    v-model:value="applyForm.AdjustType"
                    :options="[
                      { label: '增加', value: 1 },
                      { label: '扣除', value: 2 },
                    ]"
                    placeholder="请选择调整方式"
                  />
                </Form.Item>
                <Form.Item label="调整金额" required>
                  <InputNumber
                    v-model:value="applyForm.AdjustAmount"
                    :min="0.01"
                    :precision="2"
                    placeholder="请输入调整金额"
                    style="width: 100%"
                  />
                </Form.Item>
                <Form.Item :wrapper-col="{ offset: 5, span: 16 }">
                  <Space>
                    <Button
                      v-if="canApply"
                      :loading="applySubmitting"
                      class="w-28"
                      type="primary"
                      @click="submitApply"
                    >
                      提交申请
                    </Button>
                    <Button class="w-28" @click="resetApplyForm">重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>
          <CreditDataPanel
            v-else-if="item.config && activeTab === item.key"
            :ref="(el) => el && (panelRefs[item.key] = el as never)"
            :config="item.config"
          >
            <template v-if="item.key === 'pending'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canApprove"
                  :disabled="!canReviewRow(row)"
                  size="small"
                  type="link"
                  @click="openReview(row, true)"
                >
                  通过
                </Button>
                <Button
                  v-if="canReject"
                  :disabled="!canReviewRow(row)"
                  danger
                  size="small"
                  type="link"
                  @click="openReview(row, false)"
                >
                  拒绝
                </Button>
              </Space>
            </template>
          </CreditDataPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="reviewOpen"
      :confirm-loading="reviewSubmitting"
      :title="reviewApprove ? '通过平台额度申请' : '拒绝平台额度申请'"
      @ok="submitReview"
    >
      <Form layout="vertical">
        <Form.Item label="调整内容">
          <Input
            :value="
              `${walletMap[Number(reviewRow?.WalletType)] || '未知'} / ${
                Number(reviewRow?.AdjustAmount) >= 0 ? '增加' : '扣除'
              } / ${formatAmountFromCent(Number(reviewRow?.AdjustAmount))} 元`
            "
            disabled
          />
        </Form.Item>
        <Form.Item label="审核备注">
          <Input.TextArea v-model:value="finishNote" :maxlength="100" :rows="4" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无平台额度管理查看权限" title="403" />
</template>
