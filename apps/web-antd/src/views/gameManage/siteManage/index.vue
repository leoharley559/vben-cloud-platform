<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import SubGameManagePanel from './components/sub-game-manage-panel.vue';
import VenueManagePanel from './components/venue-manage-panel.vue';

defineOptions({ name: 'SiteManage' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('venue');

const tabs = computed(() =>
  [
    {
      key: 'venue',
      permission: 10948,
      tab: '场馆管理',
    },
    {
      key: 'game',
      permission: 12407,
      tab: '游戏管理',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'venue';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 站点/场馆"
    title="站点管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <VenueManagePanel
            v-if="item.key === 'venue' && activeTab === 'venue'"
          />
          <SubGameManagePanel
            v-else-if="item.key === 'game' && activeTab === 'game'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无站点管理查看权限" title="403" />
</template>
