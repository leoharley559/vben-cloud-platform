<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import SelfPanel from './components/self-panel.vue';
import SonPanel from './components/son-panel.vue';
import TotalPanel from './components/total-panel.vue';

defineOptions({ name: 'DayStatement' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    { key: 'total', permission: 10_494, tab: '汇总报表' },
    { key: 'self', permission: 10_495, tab: '自营报表' },
    { key: 'son', permission: 10_496, tab: '子包网报表' },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('total');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'total';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 日报表"
    title="日报表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" size="small" type="line">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <TotalPanel v-if="activeTab === 'total' && item.key === 'total'" />
          <SelfPanel v-else-if="activeTab === 'self' && item.key === 'self'" />
          <SonPanel v-else-if="activeTab === 'son' && item.key === 'son'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无日报表查看权限" title="403" />
</template>
