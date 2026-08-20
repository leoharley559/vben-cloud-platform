<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AisleRecharge from './components/aisle-recharge.vue';
import CreditRecordList from './components/credit-record-list.vue';
import CpReissueList from './components/cp-reissue-list.vue';
import ErrorRecordList from './components/error-record-list.vue';
import FastRechargeTabs from './components/fast-recharge.vue';
import RechargeBlacklistTabs from './components/recharge-blacklist-tabs.vue';
import RechargeLimitSettings from './components/recharge-limit-settings.vue';
import RechargeStatsPanel from './components/recharge-stats.vue';
import SelfCheckTabs from './components/self-check-tabs.vue';

defineOptions({ name: 'OperationalRechargeList' });

const { checkPermission } = useCloudPermission();
const route = useRoute();

const canAisleRecharge = computed(() => checkPermission(10261));
const canFastRecharge = computed(() => checkPermission(10262));
const canBlackList = computed(() => checkPermission(10263));
const canRateLimit = computed(() => checkPermission(10264));
const canStats = computed(() => checkPermission(11617));
const canCreditRecord = computed(() => checkPermission(11828));
const canSelfCheck = computed(() => checkPermission(12173));
const canErrorRecord = computed(() => checkPermission(12641));
const canCpReissue = computed(() => checkPermission(13305));

const canViewAny = computed(
  () =>
    canAisleRecharge.value ||
    canFastRecharge.value ||
    canBlackList.value ||
    canRateLimit.value ||
    canStats.value ||
    canCreditRecord.value ||
    canSelfCheck.value ||
    canErrorRecord.value ||
    canCpReissue.value,
);

const activeTab = ref('aisle');

function applyRouteTab() {
  const raw = String(route.query.tab || route.query.type || '');
  if ((raw === 'fast' || raw === 'second') && canFastRecharge.value) {
    activeTab.value = 'fast';
    return true;
  }
  return false;
}

function resolveDefaultTab() {
  if (applyRouteTab()) return;
  const tabs = [
    { key: 'aisle', visible: canAisleRecharge.value },
    { key: 'fast', visible: canFastRecharge.value },
    { key: 'blacklist', visible: canBlackList.value },
    { key: 'ratelimit', visible: canRateLimit.value },
    { key: 'stats', visible: canStats.value },
    { key: 'credit', visible: canCreditRecord.value },
    { key: 'selfcheck', visible: canSelfCheck.value },
    { key: 'errorRecord', visible: canErrorRecord.value },
    { key: 'cpReissue', visible: canCpReissue.value },
  ];
  const first = tabs.find((item) => item.visible);
  activeTab.value = first?.key || 'aisle';
}

onMounted(() => {
  resolveDefaultTab();
});

watch(
  () => [route.query.tab, route.query.type],
  () => {
    applyRouteTab();
  },
);
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="运营管理 · 充值列表"
    title="充值列表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canAisleRecharge" key="aisle" tab="通道充值">
          <AisleRecharge v-if="activeTab === 'aisle'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canFastRecharge" key="fast" tab="快捷充值">
          <FastRechargeTabs v-if="activeTab === 'fast'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canBlackList" key="blacklist" tab="充值黑名单">
          <RechargeBlacklistTabs v-if="activeTab === 'blacklist'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canRateLimit" key="ratelimit" tab="充值次数设置">
          <RechargeLimitSettings v-if="activeTab === 'ratelimit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canStats" key="stats" tab="充值统计">
          <RechargeStatsPanel v-if="activeTab === 'stats'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canCreditRecord" key="credit" tab="代存记录">
          <CreditRecordList v-if="activeTab === 'credit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canSelfCheck" key="selfcheck" tab="自助查单">
          <SelfCheckTabs v-if="activeTab === 'selfcheck'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canErrorRecord"
          key="errorRecord"
          tab="三方充值失败记录"
        >
          <ErrorRecordList v-if="activeTab === 'errorRecord'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canCpReissue" key="cpReissue" tab="CP补单列表">
          <CpReissueList v-if="activeTab === 'cpReissue'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="充值列表">
    <Result
      status="403"
      sub-title="需要充值列表相关权限才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
