<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ClassifiedReportPanel from './components/classified-report-panel.vue';
import GameReportPanel from './components/game-report-panel.vue';
import SubGameReportPanel from './components/sub-game-report-panel.vue';

defineOptions({ name: 'GameStatement' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    { key: 'game', permission: 13_420, tab: '游戏报表' },
    { key: 'classified', permission: 13_421, tab: '分类报表' },
    { key: 'subGame', permission: 13_422, tab: '子游戏报表' },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('game');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'game';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 游戏报表"
    title="游戏报表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" size="small" type="line">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <GameReportPanel
            v-if="activeTab === 'game' && item.key === 'game'"
          />
          <ClassifiedReportPanel
            v-else-if="activeTab === 'classified' && item.key === 'classified'"
          />
          <SubGameReportPanel
            v-else-if="activeTab === 'subGame' && item.key === 'subGame'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无游戏报表查看权限" title="403" />
</template>
