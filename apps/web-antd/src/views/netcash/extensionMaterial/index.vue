<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import MaterialList from './components/material-list.vue';
import ThemeSizePanel from './components/theme-size-panel.vue';

defineOptions({ name: 'ExtensionMaterial' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      component: MaterialList,
      key: 'material',
      permission: 10_564,
      tab: '素材列表',
    },
    {
      component: ThemeSizePanel,
      key: 'theme',
      permission: 10_565,
      tab: '主题和尺寸',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('material');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'material';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 推广素材"
    title="推广素材"
  >
    <Card size="small">
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无推广素材查看权限" title="403" />
</template>
