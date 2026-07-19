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
  Radio,
  Result,
  Space,
  Tabs,
} from 'ant-design-vue';

import {
  applyPlatformCreditApi,
  approvePlatformCreditAdjustmentApi,
  getPlatformCreditLimitApplyRecordListApi,
  getPlatformNetCashLogListApi,
  rejectPlatformCreditAdjustmentApi,
} from '#/api/netcash/credit-limit-platform';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'CreditLimitPlatformManage' });

const { checkPermission } = useCloudPermission();

const canApplyPlatformCredit = computed(() => checkPermission(11_793));
const canApprovePlatformCredit = computed(() => checkPermission(11_796));
const canRejectPlatformCredit = computed(() => checkPermission(11_797));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

const applyForm = reactive({
  AdjustAmount: undefined as number | undefined,
  AdjustType: 1 as 1 | 2,
  WalletType: 2 as 2 | 3,
});
const applySubmitting = ref(false);

async function submitApplyForm() {
  if (!applyForm.AdjustAmount || applyForm.AdjustAmount <= 0) {
    message.warning('请输入调整金额');
    return;
  }
  applySubmitting.value = true;
  try {
    const cents = Math.round(applyForm.AdjustAmount * 100);
    await applyPlatformCreditApi({
      AdjustAmount: applyForm.AdjustType === 1 ? cents : -cents,
      WalletType: applyForm.WalletType,
    });
    message.success('提交成功');
    applyForm.AdjustAmount = undefined;
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
  remarkModalIsApprove.value ? '通过平台额度申请' : '拒绝平台额度申请',
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
      ? approvePlatformCreditAdjustmentApi
      : rejectPlatformCreditAdjustmentApi;
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
      config: null,
      key: 'apply',
      permission: 11_792,
      tab: '平台额度申请',
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
          getPlatformCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        showActions: true,
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'pending',
      permission: 11_794,
      tab: '平台额度审核',
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
          getPlatformCreditLimitApplyRecordListApi(query as never),
        filters: ['username', 'date', 'status'],
        statusOptions: Object.entries(CREDIT_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'adjustRecord',
      permission: 11_798,
      tab: '平台额度调整记录',
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
          getPlatformNetCashLogListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'log',
      permission: 11_800,
      tab: '平台额度帐变记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('apply');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'apply';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 平台额度管理"
    title="平台额度管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div v-if="item.key === 'apply'" style="max-width: 480px">
            <Form v-if="canApplyPlatformCredit" layout="vertical">
              <Form.Item label="钱包类型">
                <Radio.Group v-model:value="applyForm.WalletType">
                  <Radio :value="2">代存</Radio>
                  <Radio :value="3">代客</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="调整方式">
                <Radio.Group v-model:value="applyForm.AdjustType">
                  <Radio :value="1">增加</Radio>
                  <Radio :value="2">扣除</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="调整金额（元）">
                <InputNumber
                  v-model:value="applyForm.AdjustAmount"
                  :min="0.01"
                  placeholder="请输入调整金额"
                  style="width: 100%"
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
          <NetcashGridPanel
            v-else-if="item.config && activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'pending'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canApprovePlatformCredit && Number(row.Status) === 1"
                  size="small"
                  type="link"
                  @click="openRemarkModal(row, true)"
                >
                  通过
                </Button>
                <Button
                  v-if="canRejectPlatformCredit && Number(row.Status) === 1"
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
  <Result v-else status="403" sub-title="无平台额度管理查看权限" title="403" />
</template>
