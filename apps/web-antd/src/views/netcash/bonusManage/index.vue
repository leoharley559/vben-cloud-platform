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
  approveBonusApi,
  fetchBonusApproveListApi,
  fetchBonusHistoryListApi,
  provideBonusApi,
  queryBonusAdminIdApi,
} from '#/api/netcash/bonus-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  BONUS_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'BonusManage' });

const { checkPermission } = useCloudPermission();

const canProvideBonus = computed(() => checkPermission(11_355));
const canApproveBonus = computed(() => checkPermission(11_361));
const canRejectBonus = computed(() => checkPermission(11_363));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

const provideForm = reactive({
  AdminName: '',
  Amount: undefined as number | undefined,
  HandleDesc: '',
});
const provideSubmitting = ref(false);

async function submitProvideForm() {
  if (!provideForm.AdminName.trim()) {
    message.warning('请输入代理账号');
    return;
  }
  if (!provideForm.Amount || provideForm.Amount <= 0) {
    message.warning('请输入正确的发放金额');
    return;
  }
  provideSubmitting.value = true;
  try {
    const result = await queryBonusAdminIdApi({
      Username: provideForm.AdminName.trim(),
    });
    const items = (result as { Items?: Array<Record<string, unknown>> })?.Items;
    const adminId = items?.[0]?.AdminId;
    if (!adminId) {
      message.error('未找到该代理账号');
      return;
    }
    await provideBonusApi({
      AdminId: adminId,
      AdminName: provideForm.AdminName.trim(),
      Amount: Math.round(provideForm.Amount * 100),
      BonusType: 1,
      HandleDesc: provideForm.HandleDesc,
      Hash: createRequestHash(),
      WalletType: 1,
    });
    message.success('发放成功');
    provideForm.AdminName = '';
    provideForm.Amount = undefined;
    provideForm.HandleDesc = '';
  } finally {
    provideSubmitting.value = false;
  }
}

const approveModalOpen = ref(false);
const approveModalRow = ref<null | Record<string, unknown>>(null);
const approveModalType = ref<1 | 2>(1);
const approveAmount = ref<number | undefined>(undefined);
const approveHandleDesc = ref('');
const approveSubmitting = ref(false);

const approveModalTitle = computed(() =>
  approveModalType.value === 1 ? '通过红利申请' : '拒绝红利申请',
);

function openApproveModal(row: Record<string, unknown>, type: 1 | 2) {
  approveModalRow.value = row;
  approveModalType.value = type;
  approveAmount.value = undefined;
  approveHandleDesc.value = '';
  approveModalOpen.value = true;
}

async function submitApproveModal() {
  if (!approveModalRow.value) {
    return;
  }
  approveSubmitting.value = true;
  try {
    await approveBonusApi({
      Amount:
        approveAmount.value === undefined
          ? ''
          : Math.round(approveAmount.value * 100),
      Approve: approveModalType.value,
      HandleDesc: approveHandleDesc.value,
      Ids: approveModalRow.value.Id,
    });
    message.success('操作成功');
    approveModalOpen.value = false;
    reloadCurrentGrid();
  } finally {
    approveSubmitting.value = false;
  }
}

const tabs = computed(() =>
  [
    {
      config: {
        actionWidth: 160,
        columns: [
          { field: 'Username', title: '代理账号' },
          {
            field: 'Money',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '红利金额',
          },
          {
            field: 'Status',
            formatter: (value) =>
              BONUS_APPROVE_STATUS_MAP[Number(value)] || String(value ?? '-'),
            title: '状态',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '申请时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchBonusApproveListApi(query as never),
        filters: ['username', 'date', 'status'],
        showActions: true,
        statusOptions: Object.entries(BONUS_APPROVE_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'verify',
      permission: 11_356,
      tab: '审核列表',
    },
    {
      config: {
        columns: [
          { field: 'Username', title: '代理账号' },
          {
            field: 'Money',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '红利金额',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '发放时间',
          },
          { field: 'Operator', title: '操作人' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchBonusHistoryListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'history',
      permission: 11_357,
      tab: '历史记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(
  () => canProvideBonus.value || tabs.value.length > 0,
);
const activeTab = ref('verify');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'verify';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 红利管理"
    title="红利管理"
  >
    <Card v-if="canProvideBonus" class="mb-4" title="红利发放">
      <Form layout="inline">
        <Form.Item label="代理账号">
          <Input
            v-model:value="provideForm.AdminName"
            placeholder="请输入代理账号"
            style="width: 200px"
          />
        </Form.Item>
        <Form.Item label="发放金额（元）">
          <InputNumber
            v-model:value="provideForm.Amount"
            :min="0.01"
            placeholder="请输入金额"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input
            v-model:value="provideForm.HandleDesc"
            placeholder="申请备注"
            style="width: 220px"
          />
        </Form.Item>
        <Form.Item>
          <Button
            :loading="provideSubmitting"
            type="primary"
            @click="submitProvideForm"
          >
            发放
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <Card v-if="tabs.length > 0">
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <NetcashGridPanel
            v-if="activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'verify'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canApproveBonus && Number(row.Status) === 1"
                  size="small"
                  type="link"
                  @click="openApproveModal(row, 1)"
                >
                  通过
                </Button>
                <Button
                  v-if="canRejectBonus && Number(row.Status) === 1"
                  danger
                  size="small"
                  type="link"
                  @click="openApproveModal(row, 2)"
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
      v-model:open="approveModalOpen"
      :confirm-loading="approveSubmitting"
      :title="approveModalTitle"
      @ok="submitApproveModal"
    >
      <Form layout="vertical">
        <Form.Item label="调整金额（元，留空则按申请金额处理）">
          <InputNumber
            v-model:value="approveAmount"
            :min="0.01"
            placeholder="选填"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="审核备注">
          <Input.TextArea
            v-model:value="approveHandleDesc"
            placeholder="请输入审核备注"
            :rows="3"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无红利管理查看权限" title="403" />
</template>
