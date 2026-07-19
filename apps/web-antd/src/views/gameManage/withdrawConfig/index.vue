<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ThirdWithdrawPanel from './components/third-withdraw-panel.vue';
import WithdrawAccessPanel from './components/withdraw-access-panel.vue';
import WithdrawAccountPanel from './components/withdraw-account-panel.vue';
import WithdrawBankPanel from './components/withdraw-bank-panel.vue';
import WithdrawChannelDataPanel from './components/withdraw-channel-data-panel.vue';
import WithdrawCommonRulePanel from './components/withdraw-common-rule-panel.vue';
import WithdrawRiskPanel from './components/withdraw-risk-panel.vue';

defineOptions({ name: 'WithdrawConfig' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('account');

const tabs = computed(() =>
  [
    {
      key: 'account',
      permission: 10978,
      tab: '提现配置',
    },
    {
      key: 'risk',
      permission: 10979,
      tab: '兑换风控规则',
    },
    {
      key: 'third',
      permission: 10980,
      tab: '三方代付',
    },
    {
      key: 'bank',
      permission: 10981,
      tab: '出款银行设置',
    },
    {
      key: 'data',
      permission: 10982,
      tab: '通道数据',
    },
    {
      key: 'rule',
      permission: 10983,
      tab: '通用规则配置',
    },
    {
      key: 'access',
      permission: 11961,
      tab: '提现访问记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'account';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 提现配置"
    title="提现配置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <WithdrawAccountPanel
            v-if="item.key === 'account' && activeTab === 'account'"
          />
          <ThirdWithdrawPanel
            v-else-if="item.key === 'third' && activeTab === 'third'"
          />
          <WithdrawRiskPanel
            v-else-if="item.key === 'risk' && activeTab === 'risk'"
          />
          <WithdrawBankPanel
            v-else-if="item.key === 'bank' && activeTab === 'bank'"
          />
          <WithdrawChannelDataPanel
            v-else-if="item.key === 'data' && activeTab === 'data'"
          />
          <WithdrawCommonRulePanel
            v-else-if="item.key === 'rule' && activeTab === 'rule'"
          />
          <WithdrawAccessPanel
            v-else-if="item.key === 'access' && activeTab === 'access'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无提现配置查看权限" title="403" />
</template>
