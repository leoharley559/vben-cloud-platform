<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AdjustRecords from './components/adjust-records.vue';
import CreditLimitAdjust from './components/credit-limit-adjust.vue';
import DebtRecords from './components/debt-records.vue';
import NetCashLog from './components/net-cash-log.vue';
import PendingAdjustment from './components/pending-adjustment.vue';
import PermissionSettings from './components/permission-settings.vue';

defineOptions({ name: 'CreditLimitManage' });

const { checkPermission } = useCloudPermission();
const tabs = computed(() =>
  [
    { component: CreditLimitAdjust, inner: 11_752, key: 'quota', outer: 11_744, tab: '额度调整' },
    { component: PendingAdjustment, inner: 11_755, key: 'pending', outer: 11_746, tab: '审核列表' },
    { component: AdjustRecords, inner: 11_758, key: 'record', outer: 11_747, tab: '调整记录' },
    { component: NetCashLog, inner: 11_759, key: 'log', outer: 11_748, tab: '账变记录' },
    { component: PermissionSettings, inner: 11_784, key: 'permission', outer: 11_749, tab: '权限设置' },
    { component: DebtRecords, inner: 11_758, key: 'debt', outer: 12_570, tab: '代充欠款日志' },
  ].filter((item) => checkPermission(item.outer)),
);
const activeTab = ref('');
const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || '';
});
</script>

<template>
  <Page v-if="canViewPage" auto-content-height title="代理额度管理">
    <Card>
      <Tabs v-model:active-key="activeTab" destroy-inactive-tab-pane type="card">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <Result
            v-if="!checkPermission(item.inner)"
            status="403"
            sub-title="无此模块查看权限"
            title="403"
          />
          <component :is="item.component" v-else-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理额度管理查看权限" title="403" />
</template>
