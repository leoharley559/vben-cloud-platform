<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchAgentNetcashDetailApi } from '#/api/netcash/agency-account-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import AgencyDataPanel from './components/agency-data-panel.vue';
import AgencyFinancePanel from './components/agency-finance-panel.vue';
import AgencyLoginPanel from './components/agency-login-panel.vue';
import AgencyOverviewPanel from './components/agency-overview-panel.vue';
import AgencyRelationPanel from './components/agency-relation-panel.vue';
import AgencyWalletPanel from './components/agency-wallet-panel.vue';
import AgencyWithdrawPanel from './components/agency-withdraw-panel.vue';

defineOptions({ name: 'AgencyAccountDetails' });

const route = useRoute();
const { checkPermission } = useCloudPermission();

const adminId = computed(() => String(route.params.id || route.query.id || ''));

const canAgentData = computed(() => checkPermission(13_449));
const canOverview = computed(() => checkPermission(11_252));
const canLogin = computed(() => checkPermission(11_255));
const canWithdraw = computed(() => checkPermission(11_256));
const canRelation = computed(() => checkPermission(11_257));
const canCommissionWallet = computed(() => checkPermission(11_733));
const canCreditWallet = computed(() => checkPermission(11_740));
const canFinance = computed(() => checkPermission(11_254));
const canViewPage = computed(
  () =>
    Boolean(adminId.value) &&
    (canAgentData.value ||
      canOverview.value ||
      canLogin.value ||
      canWithdraw.value ||
      canFinance.value ||
      canRelation.value ||
      canCommissionWallet.value ||
      canCreditWallet.value),
);

const activeTab = ref('overview');
const summaryName = ref('');
const summaryUsername = ref('');

const agencyName = computed(
  () =>
    String(route.query.Name || '') ||
    summaryName.value ||
    summaryUsername.value ||
    adminId.value,
);

function resolveDefaultTab() {
  const tabs = [
    { key: 'data', visible: canAgentData.value },
    { key: 'overview', visible: canOverview.value },
    { key: 'finance', visible: canFinance.value },
    { key: 'login', visible: canLogin.value },
    { key: 'withdraw', visible: canWithdraw.value },
    { key: 'relation', visible: canRelation.value },
    { key: 'commission', visible: canCommissionWallet.value },
    { key: 'credit', visible: canCreditWallet.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'overview';
}

function onOverviewSummary(payload: { name?: string; username?: string }) {
  summaryName.value = payload.name || '';
  summaryUsername.value = payload.username || '';
}

/** 非概况 Tab 时也预取账号名，保证页头标题可用 */
async function prefetchSummary() {
  if (!adminId.value || !canOverview.value) return;
  try {
    const detail = await fetchAgentNetcashDetailApi(adminId.value);
    summaryName.value = String(detail.Name || '');
    summaryUsername.value = String(detail.Username || '');
  } catch {
    /* 页头可回退到路由 Name / adminId */
  }
}

onMounted(() => {
  resolveDefaultTab();
  void prefetchSummary();
});

watch(adminId, () => {
  summaryName.value = '';
  summaryUsername.value = '';
  void prefetchSummary();
});
</script>

<template>
  <div class="h-full">
    <Page
      v-if="canViewPage"
      auto-content-height
      :description="`代理网赚 · 代理详情 ${summaryUsername || agencyName}`"
      :title="`代理账号详情-${agencyName}`"
    >
      <Card>
        <Tabs
          v-model:active-key="activeTab"
          destroy-inactive-tab-pane
          type="line"
          size="small"
        >
          <Tabs.TabPane v-if="canAgentData" key="data" tab="代理数据">
            <AgencyDataPanel v-if="activeTab === 'data'" :admin-id="adminId" />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canOverview" key="overview" tab="代理概况">
            <AgencyOverviewPanel
              v-if="activeTab === 'overview'"
              :admin-id="adminId"
              @update:summary="onOverviewSummary"
            />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canFinance" key="finance" tab="财务账户">
            <AgencyFinancePanel
              v-if="activeTab === 'finance'"
              :admin-id="adminId"
            />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canLogin" key="login" tab="登录信息">
            <AgencyLoginPanel
              v-if="activeTab === 'login'"
              :admin-id="adminId"
            />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canWithdraw" key="withdraw" tab="提款记录">
            <AgencyWithdrawPanel
              v-if="activeTab === 'withdraw'"
              :admin-id="adminId"
            />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canRelation" key="relation" tab="关联账号">
            <AgencyRelationPanel
              v-if="activeTab === 'relation'"
              :admin-id="adminId"
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            v-if="canCommissionWallet"
            key="commission"
            tab="佣金钱包"
          >
            <AgencyWalletPanel
              v-if="activeTab === 'commission'"
              :admin-id="adminId"
              wallet="commission"
            />
          </Tabs.TabPane>
          <Tabs.TabPane v-if="canCreditWallet" key="credit" tab="代存钱包">
            <AgencyWalletPanel
              v-if="activeTab === 'credit'"
              :admin-id="adminId"
              wallet="credit"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </Page>
    <Result
      v-else
      status="403"
      sub-title="无代理详情查看权限或缺少代理 Id"
      title="403"
    />
  </div>
</template>
