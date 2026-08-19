<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BonusAuditPanel from './components/bonus-audit-panel.vue';
import BonusHistoryPanel from './components/bonus-history-panel.vue';
import BonusProvidePanel from './components/bonus-provide-panel.vue';

defineOptions({ name: 'BonusManage' });

const { checkPermission } = useCloudPermission();

const canProvide = computed(() => checkPermission(11_355));
const canAudit = computed(() => checkPermission(11_356));
const canHistory = computed(() => checkPermission(11_357));

const canViewAny = computed(
  () => canProvide.value || canAudit.value || canHistory.value,
);

const activeTab = ref('provide');

function resolveDefaultTab() {
  const tabs = [
    { key: 'provide', visible: canProvide.value },
    { key: 'audit', visible: canAudit.value },
    { key: 'history', visible: canHistory.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'provide';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="代理网赚 · 红利管理"
    title="红利管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canProvide" key="provide" tab="红利发放">
          <BonusProvidePanel v-if="activeTab === 'provide'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canAudit" key="audit" tab="审核列表">
          <BonusAuditPanel v-if="activeTab === 'audit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canHistory" key="history" tab="历史记录">
          <BonusHistoryPanel v-if="activeTab === 'history'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="红利管理">
    <Result
      status="403"
      sub-title="需要红利管理相关权限才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
