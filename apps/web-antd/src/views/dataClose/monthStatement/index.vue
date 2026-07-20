<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import SelfPanel from './components/self-panel.vue';
import SonPanel from './components/son-panel.vue';
import TotalPanel from './components/total-panel.vue';

defineOptions({ name: 'MonthStatement' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    { key: 'first', permission: 10_505, tab: '汇总报表' },
    { key: 'second', permission: 10_506, tab: '自营报表' },
    { key: 'third', permission: 10_507, tab: '子包网报表' },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('first');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'first';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 月报表"
    title="月报表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <TotalPanel v-if="activeTab === 'first' && item.key === 'first'" />
          <SelfPanel v-else-if="activeTab === 'second' && item.key === 'second'" />
          <SonPanel v-else-if="activeTab === 'third' && item.key === 'third'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无月报表查看权限" title="403" />
</template>
