<script lang="ts" setup>
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Space,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  adjustDkPlayerMoneyApi,
  applyDkCreditApi,
  fetchDkCreditRecordApi,
  getAgentDkAccountLimitApi,
  getDkAccountLimitListApi,
  getDkCreditLimitApplyRecordListApi,
  getDkNetCashLogListApi,
  getPlayerAvailableDeductCreditApi,
} from '#/api/netcash/dk-credit';
import {
  approveCreditLimitApi,
  rejectCreditLimitApi,
} from '#/api/netcash/credit-limit';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'DkCreditManage' });

const { checkPermission } = useCloudPermission();

const canApplyCredit = computed(() => checkPermission(11_881));
const canTopup = computed(() => checkPermission(11_882));
const canDeduct = computed(() => checkPermission(11_896));
const canApproveCredit = computed(() => checkPermission(11_894));
const canRejectCredit = computed(() => checkPermission(11_895));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

const creditInfo = reactive({
  AppliableAmount: 0,
  Credit: 0,
  TotalCreditLimit: 0,
});
const applyForm = reactive({
  AdjustAmount: undefined as number | undefined,
  ApplyNote: '',
});
const applySubmitting = ref(false);
const applyModalOpen = ref(false);

async function loadCreditInfo() {
  if (!canApplyCredit.value) {
    return;
  }
  try {
    const data = await getAgentDkAccountLimitApi();
    const items = (
      data?.Items && typeof data.Items === 'object' ? data.Items : data
    ) as Record<string, unknown>;
    creditInfo.Credit = Number(items?.Credit || 0) / 100;
    creditInfo.AppliableAmount = Number(items?.AppliableAmount || 0) / 100;
    creditInfo.TotalCreditLimit = Number(items?.TotalCreditLimit || 0) / 100;
  } catch {
    // ignore
  }
}

function openApplyModal() {
  applyForm.AdjustAmount = undefined;
  applyForm.ApplyNote = '';
  applyModalOpen.value = true;
  void loadCreditInfo();
}

async function submitApplyForm() {
  if (!applyForm.AdjustAmount || applyForm.AdjustAmount === 0) {
    message.warning('请输入申请额度');
    return;
  }
  applySubmitting.value = true;
  try {
    await applyDkCreditApi({
      AdjustAmount: Math.round(applyForm.AdjustAmount * 100),
      AgentType: 3,
      ApplyNote: applyForm.ApplyNote,
      TransferType: 3,
      WalletType: 3,
    });
    message.success('提交成功');
    applyModalOpen.value = false;
    void loadCreditInfo();
    reloadCurrentGrid();
  } finally {
    applySubmitting.value = false;
  }
}

const adjustModalOpen = ref(false);
const adjustSubmitting = ref(false);
const adjustForm = reactive({
  Amount: undefined as number | undefined,
  AvailableDeductAmount: 0,
  Gold: '',
  PayPassword: '',
  PlayerId: 0,
  PlayerWallet: 0,
  ReferenceAccount: '',
  Remarks: '',
  WithdrawWaterMultiply: undefined as number | undefined,
  dialogType: 'adjust' as 'adjust' | 'deduct',
});

function openAdjustModal(row: Record<string, unknown>) {
  adjustForm.dialogType = 'adjust';
  adjustForm.PlayerId = Number(row.PlayerId);
  adjustForm.ReferenceAccount = String(row.LoginAccount || '');
  adjustForm.Amount = undefined;
  adjustForm.WithdrawWaterMultiply = undefined;
  adjustForm.PayPassword = '';
  adjustForm.Remarks = '';
  adjustForm.PlayerWallet = 0;
  adjustForm.Gold = (Number(row.Gold || 0) / 100).toFixed(2);
  adjustForm.AvailableDeductAmount = 0;
  adjustModalOpen.value = true;
}

async function openDeductModal(row: Record<string, unknown>) {
  try {
    const result = await getPlayerAvailableDeductCreditApi({
      PlayerId: String(row.PlayerId),
    });
    const data = (result?.Items || result) as Record<string, unknown>;
    const available = Number(data?.AvailableDeductAmount || 0);
    const gold = Number(data?.Gold || 0);
    if (!available || available <= 0 || gold <= 0) {
      message.error('无可下分额度');
      return;
    }
    adjustForm.dialogType = 'deduct';
    adjustForm.PlayerId = Number(data.PlayerId || row.PlayerId);
    adjustForm.ReferenceAccount = String(
      data.LoginAccount || row.LoginAccount || '',
    );
    adjustForm.Amount = undefined;
    adjustForm.WithdrawWaterMultiply = undefined;
    adjustForm.PayPassword = '';
    adjustForm.Remarks = '';
    adjustForm.Gold = (gold / 100).toFixed(2);
    adjustForm.AvailableDeductAmount = Math.min(available, gold) / 100;
    adjustModalOpen.value = true;
  } catch {
    // request interceptor already tips
  }
}

async function submitAdjustForm() {
  if (!adjustForm.Amount || adjustForm.Amount <= 0) {
    message.warning('请输入金额');
    return;
  }
  if (
    adjustForm.dialogType === 'deduct' &&
    adjustForm.Amount > adjustForm.AvailableDeductAmount
  ) {
    message.warning('超过可下分额度');
    return;
  }
  adjustSubmitting.value = true;
  try {
    const amountCent = Math.round(
      adjustForm.dialogType === 'adjust'
        ? adjustForm.Amount * 100
        : -adjustForm.Amount * 100,
    );
    await adjustDkPlayerMoneyApi({
      Items: JSON.stringify([
        {
          Amount: amountCent,
          PayPassword: adjustForm.PayPassword,
          PlayerId: adjustForm.PlayerId,
          PlayerWallet: adjustForm.PlayerWallet,
          ReferenceAccount: adjustForm.ReferenceAccount,
          Remarks: adjustForm.Remarks,
          WithdrawWaterMultiply: Math.round(
            Number(adjustForm.WithdrawWaterMultiply || 0),
          ),
        },
      ]),
      PayPassword: adjustForm.PayPassword,
    });
    message.success('操作成功');
    adjustModalOpen.value = false;
    reloadCurrentGrid();
  } finally {
    adjustSubmitting.value = false;
  }
}

const remarkModalOpen = ref(false);
const remarkModalRow = ref<null | Record<string, unknown>>(null);
const remarkModalIsApprove = ref(true);
const remarkValue = ref('');
const remarkSubmitting = ref(false);

const remarkModalTitle = computed(() =>
  remarkModalIsApprove.value ? '通过额度调整申请' : '拒绝额度调整申请',
);

function openRemarkModal(row: Record<string, unknown>, isApprove: boolean) {
  remarkModalRow.value = row;
  remarkModalIsApprove.value = isApprove;
  remarkValue.value = '';
  remarkModalOpen.value = true;
}

async function submitRemarkModal() {
  if (!remarkModalRow.value) {
    return;
  }
  remarkSubmitting.value = true;
  try {
    const api = remarkModalIsApprove.value
      ? approveCreditLimitApi
      : rejectCreditLimitApi;
    await api({
      FinishNote: remarkValue.value,
      Ids: String(remarkModalRow.value.Id),
    });
    message.success('操作成功');
    remarkModalOpen.value = false;
    reloadCurrentGrid();
  } finally {
    remarkSubmitting.value = false;
  }
}

const tabs = computed(() =>
  [
    {
      config: {
        actionWidth: 160,
        columns: [
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'PackageName', title: '产品包' },
          {
            field: 'Gold',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '主钱包',
          },
          {
            field: 'VipLevel',
            formatter: (value) => `VIP ${value ?? '-'}`,
            title: 'VIP',
          },
          { field: 'PromoterUserName', title: '所属代理' },
          {
            field: 'Status',
            formatter: (value) =>
              Number(value) === 1 ? '正常' : String(value ?? '-'),
            title: '状态',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getDkAccountLimitListApi(query as never),
        filters: ['login', 'package'],
        showActions: canTopup.value || canDeduct.value,
      } satisfies NetcashGridConfig,
      key: 'adjust',
      permission: 11_880,
      tab: '代客充值',
    },
    {
      config: {
        actionWidth: 140,
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'AgentNickName', title: '代理昵称' },
          {
            field: 'ApplyAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '申请额度',
          },
          {
            field: 'Status',
            formatter: (value) =>
              CREDIT_APPROVE_STATUS_MAP[Number(value)] || String(value ?? '-'),
            title: '状态',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '申请时间',
          },
        ],
        extraQuery: { Status: 1 },
        fetchApi: (query: Record<string, unknown>) =>
          getDkCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        showActions: canApproveCredit.value || canRejectCredit.value,
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({ label, value: Number(value) }),
        ),
      } satisfies NetcashGridConfig,
      key: 'pending',
      permission: 11_883,
      tab: '额度审核',
    },
    {
      config: {
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'LoginAccount', title: '游戏账号' },
          {
            field: 'Amount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '金额',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'Operator', title: '操作人' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchDkCreditRecordApi(query as never),
        filters: ['agent', 'login', 'date'],
      } satisfies NetcashGridConfig,
      key: 'recharge',
      permission: 11_884,
      tab: '充值/下分记录',
    },
    {
      config: {
        columns: [
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'Credit',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '可用额度',
          },
          {
            field: 'Gold',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '主钱包',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getDkAccountLimitListApi(query as never),
        filters: ['agent', 'login'],
      } satisfies NetcashGridConfig,
      key: 'account',
      permission: 11_885,
      tab: '账号列表',
    },
    {
      config: {
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'ApplyAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '申请额度',
          },
          {
            field: 'Status',
            formatter: (value) =>
              CREDIT_APPROVE_STATUS_MAP[Number(value)] || String(value ?? '-'),
            title: '状态',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '申请时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getDkCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({ label, value: Number(value) }),
        ),
      } satisfies NetcashGridConfig,
      key: 'adjustRecord',
      permission: 11_887,
      tab: '额度调整记录',
    },
    {
      config: {
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'ApplyAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '变更金额',
          },
          {
            field: 'AmountBefore',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '变更前额度',
          },
          {
            field: 'AmountAfter',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '变更后额度',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getDkNetCashLogListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'log',
      permission: 11_888,
      tab: '额度帐变记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('adjust');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'adjust';
  void loadCreditInfo();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代客充值"
    title="代客充值"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div
            v-if="
              item.key === 'adjust' && canApplyCredit && activeTab === 'adjust'
            "
            class="mb-4 flex flex-wrap items-center gap-3 rounded border border-dashed p-4 text-sm"
          >
            <span>可用额度：{{ creditInfo.Credit.toFixed(2) }}</span>
            <span>可申请：{{ creditInfo.AppliableAmount.toFixed(2) }}</span>
            <Button type="primary" @click="openApplyModal">申请额度</Button>
          </div>
          <NetcashGridPanel
            v-if="item.config && activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'adjust'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canTopup"
                  size="small"
                  type="link"
                  @click="openAdjustModal(row)"
                >
                  上分
                </Button>
                <Button
                  v-if="canDeduct"
                  danger
                  size="small"
                  type="link"
                  @click="openDeductModal(row)"
                >
                  下分
                </Button>
              </Space>
            </template>
            <template v-else-if="item.key === 'pending'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canApproveCredit && Number(row.Status) === 1"
                  size="small"
                  type="link"
                  @click="openRemarkModal(row, true)"
                >
                  通过
                </Button>
                <Button
                  v-if="canRejectCredit && Number(row.Status) === 1"
                  danger
                  size="small"
                  type="link"
                  @click="openRemarkModal(row, false)"
                >
                  拒绝
                </Button>
              </Space>
            </template>
          </NetcashGridPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="applyModalOpen"
      :confirm-loading="applySubmitting"
      title="申请额度"
      @ok="submitApplyForm"
    >
      <Form layout="vertical">
        <Form.Item label="当前可用额度">
          <Input :value="creditInfo.Credit.toFixed(2)" disabled />
        </Form.Item>
        <Form.Item label="可申请额度">
          <Input :value="creditInfo.AppliableAmount.toFixed(2)" disabled />
        </Form.Item>
        <Form.Item label="申请额度（元）" required>
          <InputNumber
            v-model:value="applyForm.AdjustAmount"
            :min="0.01"
            placeholder="请输入申请额度"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="applyForm.ApplyNote" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="adjustModalOpen"
      :confirm-loading="adjustSubmitting"
      :title="adjustForm.dialogType === 'adjust' ? '上分' : '下分'"
      @ok="submitAdjustForm"
    >
      <Form layout="vertical">
        <Form.Item label="游戏账号">
          <Input v-model:value="adjustForm.ReferenceAccount" disabled />
        </Form.Item>
        <Form.Item
          :label="
            adjustForm.dialogType === 'adjust'
              ? '上分金额（元）'
              : '下分金额（元）'
          "
          required
        >
          <InputNumber
            v-model:value="adjustForm.Amount"
            :min="0.01"
            :placeholder="
              adjustForm.dialogType === 'deduct'
                ? `可下分 ${adjustForm.AvailableDeductAmount}`
                : '请输入金额'
            "
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item
          v-if="adjustForm.dialogType === 'adjust'"
          label="提现流水倍数"
        >
          <InputNumber
            v-model:value="adjustForm.WithdrawWaterMultiply"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="支付密码">
          <Input.Password
            v-model:value="adjustForm.PayPassword"
            placeholder="请输入支付密码"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="adjustForm.Remarks" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="remarkModalOpen"
      :confirm-loading="remarkSubmitting"
      :title="remarkModalTitle"
      @ok="submitRemarkModal"
    >
      <Form layout="vertical">
        <Form.Item label="备注">
          <Input.TextArea v-model:value="remarkValue" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代客充值查看权限" title="403" />
</template>
