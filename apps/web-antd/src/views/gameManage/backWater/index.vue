<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BackWaterHandPanel from './components/back-water-hand-panel.vue';
import BackWaterRecordPanel from './components/back-water-record-panel.vue';
import BackWaterReviewPanel from './components/back-water-review-panel.vue';
import BackWaterSchemePanel from './components/back-water-scheme-panel.vue';

defineOptions({ name: 'BackWater' });

const { checkPermission } = useCloudPermission();
const route = useRoute();
const activeTab = ref('config');

const tabs = computed(() =>
  [
    {
      key: 'config',
      permission: 11_073,
      tab: '返水配置',
    },
    { key: 'record', permission: 11_074, tab: '返水记录' },
    {
      key: 'hand',
      permission: 11_075,
      tab: '手动返水',
    },
    {
      key: 'audit',
      permission: 11_076,
      tab: '返水审核',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

watch(
  [
    () => route.query.id,
    () => route.query.tab,
    () => route.query.type,
    tabs,
  ],
  () => {
    const requested = route.query.id
      ? 'record'
      : String(route.query.tab || route.query.type || activeTab.value);
    activeTab.value = tabs.value.some((item) => item.key === requested)
      ? requested
      : tabs.value[0]?.key || '';
  },
  { immediate: true },
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 返水设置"
    title="返水设置"
  >
    <Card class="back-water-card" :bordered="false">
      <Tabs v-model:active-key="activeTab" type="line" size="large">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <BackWaterReviewPanel
            v-if="item.key === 'audit' && activeTab === 'audit'"
          />
          <BackWaterSchemePanel
            v-else-if="item.key === 'config' && activeTab === 'config'"
            :initial-scheme-id="String(route.query.schemeId || '')"
          />
          <BackWaterHandPanel
            v-else-if="item.key === 'hand' && activeTab === 'hand'"
          />
          <BackWaterRecordPanel
            v-else-if="item.key === 'record' && activeTab === 'record'"
            :player-id="String(route.query.id || '')"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无返水设置查看权限" title="403" />
</template>

<style scoped>
.back-water-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(15 23 42 / 6%);
}
</style>
