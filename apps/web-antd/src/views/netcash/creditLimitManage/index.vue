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
  message,
  Modal,
  Result,
  Space,
  Tabs,
} from 'ant-design-vue';

import {
  applyCreditLimitApi,
  approveCreditLimitApi,
  fetchDebtListApi,
  getAgentPermissionsApi,
  getCreditLimitApplyRecordListApi,
  getNetCashAccountListApi,
  getNetCashLogListApi,
  rejectCreditLimitApi,
} from '#/api/netcash/credit-limit';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'CreditLimitManage' });

const { checkPermission } = useCloudPermission();

const canApplyCredit = computed(() => checkPermission(11_753));
const canApproveCredit = computed(() => checkPermission(11_756));
const canRejectCredit = computed(() => checkPermission(11_757));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

const applyForm = reactive({
  AgentAccount: '',
  ApplyAmount: undefined as number | undefined,
});
const applySubmitting = ref(false);

async function submitApplyForm() {
  if (!applyForm.AgentAccount.trim()) {
    message.warning('请输入代理账号');
    return;
  }
  if (!applyForm.ApplyAmount || applyForm.ApplyAmount === 0) {
    message.warning('请输入调整额度');
    return;
  }
  applySubmitting.value = true;
  try {
    await applyCreditLimitApi({
      AgentAccounts: applyForm.AgentAccount.trim(),
      AgentType: 2,
      ApplyNote: '',
      TransferType: 3,
      AdjustAmount: Math.round(applyForm.ApplyAmount * 100),
      WalletType: 2,
    });
    message.success('提交成功');
    applyForm.AgentAccount = '';
    applyForm.ApplyAmount = undefined;
    reloadCurrentGrid();
  } finally {
    applySubmitting.value = false;
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
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'Credit',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '可用额度',
          },
          {
            field: 'UsedCredit',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '已用额度',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getNetCashAccountListApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'quota',
      permission: 11_744,
      tab: '额度管理',
    },
    {
      config: {
        actionWidth: 160,
        columns: [
          { field: 'OrderId', title: '单号' },
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
        extraQuery: { Status: 1 },
        fetchApi: (query: Record<string, unknown>) =>
          getCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        showActions: true,
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'verify',
      permission: 11_746,
      tab: '审核列表',
    },
    {
      config: {
        columns: [
          { field: 'OrderId', title: '单号' },
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
          getCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'adjustRecord',
      permission: 11_747,
      tab: '调整记录',
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
          getNetCashLogListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'log',
      permission: 11_748,
      tab: '帐变记录',
    },
    {
      config: {
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'PermissionName', title: '权限项' },
          {
            field: 'IsOpen',
            formatter: (value) => (Number(value) === 1 ? '开启' : '关闭'),
            title: '状态',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          getAgentPermissionsApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'permission',
      permission: 11_749,
      tab: '权限设置',
    },
    {
      config: {
        columns: [
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'DueCredit',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '欠款额度',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchDebtListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'debt',
      permission: 12_570,
      tab: '代充欠款日志',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('quota');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'quota';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理额度管理"
    title="代理额度管理"
  >
    <Card>
      <div
        v-if="activeTab === 'quota' && canApplyCredit"
        class="mb-4 rounded border border-dashed p-4"
      >
        <Form layout="inline">
          <Form.Item label="代理账号">
            <Input
              v-model:value="applyForm.AgentAccount"
              placeholder="请输入代理账号"
              style="width: 200px"
            />
          </Form.Item>
          <Form.Item label="调整额度（元）">
            <InputNumber
              v-model:value="applyForm.ApplyAmount"
              placeholder="正数为增加，负数为扣除"
              style="width: 200px"
            />
          </Form.Item>
          <Form.Item>
            <Button
              :loading="applySubmitting"
              type="primary"
              @click="submitApplyForm"
            >
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <NetcashGridPanel
            v-if="item.config && activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'verify'" #actions="{ row }">
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
      v-model:open="remarkModalOpen"
      :confirm-loading="remarkSubmitting"
      :title="remarkModalTitle"
      @ok="submitRemarkModal"
    >
      <Input.TextArea
        v-model:value="remarkValue"
        placeholder="备注（选填）"
        :rows="4"
      />
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代理额度管理查看权限" title="403" />
</template>
