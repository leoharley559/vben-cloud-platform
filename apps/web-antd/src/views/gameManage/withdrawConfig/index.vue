<script lang="ts" setup>
import type { Component } from 'vue';

import { computed, ref, watchEffect } from 'vue';

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
const activeTab = ref('');

const panelMap: Record<string, Component> = {
  access: WithdrawAccessPanel,
  account: WithdrawAccountPanel,
  bank: WithdrawBankPanel,
  data: WithdrawChannelDataPanel,
  risk: WithdrawRiskPanel,
  rule: WithdrawCommonRulePanel,
  third: ThirdWithdrawPanel,
};

const tabs = computed(() =>
  [
    {
      key: 'account',
      permission: 10_978,
      tab: '提现配置',
    },
    {
      key: 'risk',
      permission: 10_979,
      tab: '兑换风控规则',
    },
    {
      key: 'third',
      permission: 10_980,
      tab: '三方代付',
    },
    {
      key: 'bank',
      permission: 10_981,
      tab: '出款银行设置',
    },
    {
      key: 'data',
      permission: 10_982,
      tab: '通道数据',
    },
    {
      key: 'rule',
      permission: 10_983,
      tab: '通用规则配置',
    },
    {
      key: 'access',
      permission: 11_961,
      tab: '提现访问记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

watchEffect(() => {
  if (!tabs.value.some((item) => item.key === activeTab.value)) {
    activeTab.value = tabs.value[0]?.key || '';
  }
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
      <Tabs
        v-model:active-key="activeTab"
        destroy-inactive-tab-pane
        type="line"
        size="small"
      >
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="panelMap[item.key]" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无提现配置查看权限" title="403" />
</template>
