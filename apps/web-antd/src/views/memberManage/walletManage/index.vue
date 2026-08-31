<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import CardManageList from './components/card-manage-list.vue';
import CardMultiBindList from './components/card-multi-bind-list.vue';
import CryptoAddressList from './components/crypto-address-list.vue';
import EWalletList from './components/e-wallet-list.vue';
import PayAccountManageList from './components/pay-account-manage-list.vue';

defineOptions({ name: 'WalletManage' });

const { checkPermission } = useCloudPermission();

const canCard = computed(
  () => checkPermission(12_949) || checkPermission(11_469),
);
const canEWallet = computed(() => checkPermission(12_945));
const canCrypto = computed(() => checkPermission(11_474));
const canMultiBind = computed(() => checkPermission(12_702));

const canViewAny = computed(
  () =>
    canCard.value || canEWallet.value || canCrypto.value || canMultiBind.value,
);

const activeTab = ref('card');

function resolveDefaultTab() {
  const tabs = [
    { key: 'card', visible: canCard.value },
    { key: 'alipay', visible: canCard.value },
    { key: 'wechat', visible: canCard.value },
    { key: 'eWallet', visible: canEWallet.value },
    { key: 'crypto', visible: canCrypto.value },
    { key: 'multiBind', visible: canMultiBind.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'card';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="会员管理 · 钱包管理"
    title="钱包管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canCard" key="card" tab="银行卡管理">
          <CardManageList v-if="activeTab === 'card'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canCard" key="alipay" tab="支付宝管理">
          <PayAccountManageList
            v-if="activeTab === 'alipay'"
            resource-type="alipay"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canCard" key="wechat" tab="微信管理">
          <PayAccountManageList
            v-if="activeTab === 'wechat'"
            resource-type="wechat"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canEWallet" key="eWallet" tab="电子钱包">
          <EWalletList v-if="activeTab === 'eWallet'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canCrypto" key="crypto" tab="虚拟币地址">
          <CryptoAddressList v-if="activeTab === 'crypto'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canMultiBind" key="multiBind" tab="多账号绑定">
          <CardMultiBindList v-if="activeTab === 'multiBind'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无钱包管理查看权限" title="403" />
</template>
