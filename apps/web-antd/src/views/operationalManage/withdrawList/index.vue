<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import RedeemList from './components/redeem-list.vue';
import SendOrderListPanel from './components/send-order-list.vue';
import SendOrderManageList from './components/send-order-manage.vue';
import WithdrawFinanceList from './components/withdraw-finance-list.vue';
import WithdrawOrderStat from './components/withdraw-order-stat.vue';
import WithdrawThirdPartyRecord from './components/withdraw-third-party-record.vue';
import WithdrawWaterList from './components/withdraw-water-list.vue';
import WithdrawWhiteList from './components/withdraw-white-list.vue';

defineOptions({ name: 'OperationalWithdrawList' });

const { checkPermission } = useCloudPermission();

const canRedeemList = computed(() => checkPermission(10346));
const canWhiteList = computed(() => checkPermission(10347));
const canSendOrderManage = computed(() => checkPermission(10348));
const canSendOrderList = computed(() => checkPermission(10349));
const canWithdrawSonList = computed(() => checkPermission(10350));
const canOrderStat = computed(() => checkPermission(10387));
const canThirdPartyRecord = computed(() => checkPermission(13165));
const canWithdrawWater = computed(() => checkPermission(13230));

const canViewAny = computed(
  () =>
    canRedeemList.value ||
    canWhiteList.value ||
    canSendOrderManage.value ||
    canSendOrderList.value ||
    canWithdrawSonList.value ||
    canOrderStat.value ||
    canThirdPartyRecord.value ||
    canWithdrawWater.value,
);

const activeTab = ref('redeem');

function resolveDefaultTab() {
  const tabs = [
    { key: 'redeem', visible: canRedeemList.value },
    { key: 'white', visible: canWhiteList.value },
    { key: 'sendManage', visible: canSendOrderManage.value },
    { key: 'sendList', visible: canSendOrderList.value },
    { key: 'withdrawSon', visible: canWithdrawSonList.value },
    { key: 'orderStat', visible: canOrderStat.value },
    { key: 'thirdParty', visible: canThirdPartyRecord.value },
    { key: 'withdrawWater', visible: canWithdrawWater.value },
  ];
  const first = tabs.find((item) => item.visible);
  activeTab.value = first?.key || 'redeem';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="运营管理 · 提现列表"
    title="提现列表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canRedeemList" key="redeem" tab="兑换列表">
          <RedeemList v-if="activeTab === 'redeem'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canWhiteList" key="white" tab="提现白名单">
          <WithdrawWhiteList v-if="activeTab === 'white'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canSendOrderManage" key="sendManage" tab="派单管理">
          <SendOrderManageList v-if="activeTab === 'sendManage'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canSendOrderList" key="sendList" tab="派单列表">
          <SendOrderListPanel v-if="activeTab === 'sendList'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canWithdrawSonList"
          key="withdrawSon"
          tab="出款列表"
        >
          <WithdrawFinanceList v-if="activeTab === 'withdrawSon'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canOrderStat" key="orderStat" tab="订单统计">
          <WithdrawOrderStat v-if="activeTab === 'orderStat'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canThirdPartyRecord"
          key="thirdParty"
          tab="三方冲正记录"
        >
          <WithdrawThirdPartyRecord v-if="activeTab === 'thirdParty'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canWithdrawWater"
          key="withdrawWater"
          tab="提款流水"
        >
          <WithdrawWaterList v-if="activeTab === 'withdrawWater'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="提现列表">
    <Result
      status="403"
      sub-title="需要提现列表相关权限才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
