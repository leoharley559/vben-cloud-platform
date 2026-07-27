<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BonusAuditPanel from './components/bonus-audit-panel.vue';
import BonusHistoryPanel from './components/bonus-history-panel.vue';
import BonusProvidePanel from './components/bonus-provide-panel.vue';

defineOptions({ name: 'BonusManage' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    { key: 'provide', label: '红利发放', permission: 11_355 },
    { key: 'audit', label: '审核列表', permission: 11_356 },
    { key: 'history', label: '历史记录', permission: 11_357 },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('');

watch(
  tabs,
  (items) => {
    if (!items.some((item) => item.key === activeTab.value)) {
      activeTab.value = items[0]?.key || '';
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 红利管理"
    title="红利管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.label">
          <BonusProvidePanel
            v-if="activeTab === 'provide' && item.key === 'provide'"
          />
          <BonusAuditPanel
            v-else-if="activeTab === 'audit' && item.key === 'audit'"
          />
          <BonusHistoryPanel
            v-else-if="activeTab === 'history' && item.key === 'history'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无红利管理查看权限" title="403" />
</template>
