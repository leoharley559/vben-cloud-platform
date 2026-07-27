<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Card, Empty, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import CommonSettingPanel from './components/common-setting-panel.vue';
import ExchangeRatePanel from './components/exchange-rate-panel.vue';
import GameHelpPanel from './components/game-help-panel.vue';
import SportsTutorialPanel from './components/sports-tutorial-panel.vue';
import SystemTemplatesPanel from './components/system-templates-panel.vue';

defineOptions({ name: 'SystemSetting' });

const route = useRoute();
const { checkPermission } = useCloudPermission();
const tabs = computed(() =>
  [
    { component: GameHelpPanel, key: '1', label: '游戏帮助中心', permission: 12_240 },
    { component: CommonSettingPanel, key: '2', label: '通用规则', permission: 12_241 },
    { component: SportsTutorialPanel, key: '3', label: '体育玩法教程配置', permission: 13_104 },
    { component: ExchangeRatePanel, key: '4', label: '汇率设置', permission: 13_362 },
    { component: SystemTemplatesPanel, key: '5', label: '系统模板', permission: 13_453 },
  ].filter((item) => checkPermission(item.permission)),
);
const requestedTab = String(route.query.type || '');
const activeKey = ref(
  tabs.value.some((item) => item.key === requestedTab)
    ? requestedTab
    : tabs.value[0]?.key || '',
);
</script>

<template>
  <div class="system-setting-page">
    <Card v-if="tabs.length > 0" :bordered="false" class="tabs-card">
      <Tabs v-model:active-key="activeKey" destroy-inactive-tab-pane type="line" size="small">
        <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
          <component :is="tab.component" v-if="activeKey === tab.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
    <Card v-else :bordered="false">
      <Empty description="暂无系统设置页面权限" />
    </Card>
  </div>
</template>

<style scoped>
.system-setting-page {
  min-height: 100%;
  padding: 16px;
}

.tabs-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

:deep(.ant-card-body) {
  padding-top: 8px;
}
</style>
