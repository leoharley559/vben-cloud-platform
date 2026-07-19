<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  Space,
  Spin,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  editAgentCommissionMoneyApi,
  editAgentMobileApi,
  fetchAgentNetcashDetailApi,
} from '#/api/netcash/agency-account-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  AGENCY_ACCOUNT_TYPE_MAP,
  AGENCY_STATUS_MAP,
  AGENCY_TYPE_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import AgencyFinancePanel from './components/agency-finance-panel.vue';
import AgencyLoginPanel from './components/agency-login-panel.vue';
import AgencyWithdrawPanel from './components/agency-withdraw-panel.vue';

defineOptions({ name: 'AgencyAccountDetails' });

const route = useRoute();
const { checkPermission } = useCloudPermission();

const adminId = computed(() => String(route.query.id || route.params.id || ''));

const canOverview = computed(() => checkPermission(11_252));
const canLogin = computed(() => checkPermission(11_255));
const canWithdraw = computed(() => checkPermission(11_256));
const canFinance = computed(() => checkPermission(11_254));
const canEditMobile = computed(() => checkPermission(11_258));
const canEditMoney = computed(() => checkPermission(11_501));
const canViewPage = computed(
  () =>
    Boolean(adminId.value) &&
    (canOverview.value ||
      canLogin.value ||
      canWithdraw.value ||
      canFinance.value),
);

const loading = ref(false);
const detail = ref<Record<string, unknown>>({});
const activeTab = ref('overview');

const displayMobile = computed(() =>
  String(detail.value.Mobile || detail.value.MobileNumber || ''),
);

const canShowMoneyEdit = computed(
  () => canEditMoney.value && Number(detail.value.Type) !== 3,
);

async function loadDetail() {
  if (!adminId.value || !canOverview.value) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await fetchAgentNetcashDetailApi(adminId.value);
  } finally {
    loading.value = false;
  }
}

function resolveDefaultTab() {
  const tabs = [
    { key: 'overview', visible: canOverview.value },
    { key: 'finance', visible: canFinance.value },
    { key: 'login', visible: canLogin.value },
    { key: 'withdraw', visible: canWithdraw.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'overview';
}

const phoneModalOpen = ref(false);
const phoneSubmitting = ref(false);
const phoneForm = reactive({
  BindPhone: '',
  PhoneCode: '86',
});

const phoneCodeOptions = [
  { label: '+86', value: '86' },
  { label: '+1', value: '1' },
  { label: '+60', value: '60' },
  { label: '+63', value: '63' },
  { label: '+66', value: '66' },
  { label: '+84', value: '84' },
  { label: '+855', value: '855' },
];

function openPhoneModal() {
  const raw = displayMobile.value;
  if (raw.includes('_')) {
    const [code, phone] = raw.split('_');
    phoneForm.PhoneCode = code || '86';
    phoneForm.BindPhone = phone || '';
  } else {
    phoneForm.PhoneCode = '86';
    phoneForm.BindPhone = raw;
  }
  phoneModalOpen.value = true;
}

async function submitPhoneModal() {
  if (!phoneForm.BindPhone.trim()) {
    message.warning('请输入手机号');
    return;
  }
  phoneSubmitting.value = true;
  try {
    await editAgentMobileApi({
      Id: adminId.value,
      Mobile: `${phoneForm.PhoneCode}_${phoneForm.BindPhone.trim()}`,
    });
    message.success('手机号已更新');
    phoneModalOpen.value = false;
    await loadDetail();
  } finally {
    phoneSubmitting.value = false;
  }
}

const moneyModalOpen = ref(false);
const moneySubmitting = ref(false);
const moneyValue = ref<number | undefined>();

function openMoneyModal() {
  moneyValue.value = Number(detail.value.Money || 0) / 100;
  moneyModalOpen.value = true;
}

async function submitMoneyModal() {
  if (moneyValue.value === undefined || moneyValue.value < 0) {
    message.warning('请输入有效佣金余额');
    return;
  }
  if (!Number.isInteger(moneyValue.value)) {
    message.warning('请输入整数金额（元）');
    return;
  }
  moneySubmitting.value = true;
  try {
    await editAgentCommissionMoneyApi({
      AdminId: adminId.value,
      Money: Math.round(moneyValue.value * 100),
    });
    message.success('佣金余额已更新');
    moneyModalOpen.value = false;
    await loadDetail();
  } finally {
    moneySubmitting.value = false;
  }
}

onMounted(() => {
  resolveDefaultTab();
  loadDetail();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    :description="`代理网赚 · 代理详情 ${detail.Username || adminId}`"
    title="代理账号详情"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canOverview" key="overview" tab="代理概况">
          <Spin :spinning="loading">
            <Descriptions bordered :column="2" size="small">
              <Descriptions.Item label="代理账号">
                {{ detail.Username || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="姓名">
                {{ detail.Name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {{ AGENCY_STATUS_MAP[Number(detail.Status)] || detail.Status }}
              </Descriptions.Item>
              <Descriptions.Item label="代理类型">
                {{ AGENCY_TYPE_MAP[Number(detail.Type)] || detail.Type }}
              </Descriptions.Item>
              <Descriptions.Item label="代理模式">
                {{
                  AGENCY_ACCOUNT_TYPE_MAP[Number(detail.AccountType)] ||
                  detail.AccountType
                }}
              </Descriptions.Item>
              <Descriptions.Item label="代理层级">
                {{ detail.AccountLevel || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="上级代理">
                {{ detail.AgentName || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  <span>{{ displayMobile || '-' }}</span>
                  <Button
                    v-if="canEditMobile"
                    size="small"
                    type="link"
                    @click="openPhoneModal"
                  >
                    {{ displayMobile ? '编辑' : '绑定' }}
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="佣金余额">
                <Space>
                  <span>{{
                    formatAmountFromCent(Number(detail.Money || 0))
                  }}</span>
                  <Button
                    v-if="canShowMoneyEdit"
                    size="small"
                    type="link"
                    @click="openMoneyModal"
                  >
                    调整
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {{ formatNetcashDateTime(detail.CreateTime as string) }}
              </Descriptions.Item>
              <Descriptions.Item label="团队">
                {{ detail.TeamName || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canFinance" key="finance" tab="财务账户">
          <AgencyFinancePanel
            v-if="activeTab === 'finance'"
            :admin-id="adminId"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canLogin" key="login" tab="登录信息">
          <AgencyLoginPanel v-if="activeTab === 'login'" :admin-id="adminId" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canWithdraw" key="withdraw" tab="提款记录">
          <AgencyWithdrawPanel
            v-if="activeTab === 'withdraw'"
            :admin-id="adminId"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="phoneModalOpen"
      :confirm-loading="phoneSubmitting"
      title="编辑手机号"
      @ok="submitPhoneModal"
    >
      <Form layout="vertical">
        <Form.Item label="区号">
          <Select
            v-model:value="phoneForm.PhoneCode"
            :options="phoneCodeOptions"
            style="width: 120px"
          />
        </Form.Item>
        <Form.Item label="手机号" required>
          <Input
            v-model:value="phoneForm.BindPhone"
            placeholder="请输入手机号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="moneyModalOpen"
      :confirm-loading="moneySubmitting"
      title="调整佣金余额"
      @ok="submitMoneyModal"
    >
      <Form layout="vertical">
        <Form.Item label="佣金余额（元，整数）" required>
          <InputNumber
            v-model:value="moneyValue"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result
    v-else
    status="403"
    sub-title="无代理详情查看权限或缺少代理 ID"
    title="403"
  />
</template>
