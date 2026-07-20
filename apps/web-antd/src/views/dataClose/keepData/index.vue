<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import KeepExtantPanel from './components/extant-panel.vue';
import KeepLoginRetentionPanel from './components/login-retention-panel.vue';
import KeepLtvPanel from './components/ltv-panel.vue';
import KeepOneTimeUserPanel from './components/one-time-user-panel.vue';
import KeepSectionRetentionPanel from './components/section-retention-panel.vue';

defineOptions({ name: 'KeepData' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      component: KeepExtantPanel,
      key: 'extant',
      permission: 10_526,
      show: checkPermission(10_526),
      tab: '留存',
    },
    {
      component: KeepLoginRetentionPanel,
      key: 'login',
      permission: 10_527,
      show: checkPermission(10_527),
      tab: '登录留存',
    },
    {
      component: KeepSectionRetentionPanel,
      key: 'section',
      permission: 10_528,
      show: checkPermission(10_528),
      tab: '区间留存',
    },
    {
      component: KeepLtvPanel,
      key: 'ltv',
      permission: 10_529,
      show: checkPermission(10_529),
      tab: 'LTV数据',
    },
    {
      component: KeepOneTimeUserPanel,
      key: 'oneTime',
      permission: 0,
      show: true,
      tab: '一次性用户',
    },
  ].filter((item) => item.show),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('extant');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'extant';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 粘度分析矩阵（留存 / LTV / 一次性用户）"
    title="粘度分析"
  >
    <Card size="small">
      <Tabs v-model:active-key="activeTab" size="small" type="line">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无粘度分析查看权限" title="403" />
</template>
