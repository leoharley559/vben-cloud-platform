<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import JuniorChangeRecordPanel from './components/junior-change-record-panel.vue';
import JuniorMemberListPanel from './components/junior-member-list-panel.vue';

defineOptions({ name: 'JuniorMember' });

const { checkPermission } = useCloudPermission();
const canViewMember = computed(() => checkPermission(10_153));
const canViewChange = computed(() => checkPermission(10_154));
const canViewPage = computed(() => canViewMember.value || canViewChange.value);

const tabs = computed(() =>
  [
    { key: 'member', label: '下级成员', visible: canViewMember.value },
    { key: 'change', label: '变更记录', visible: canViewChange.value },
  ].filter((item) => item.visible),
);

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
    description="代理网赚 · 下级成员"
    title="下级成员"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canViewMember" key="member" tab="下级成员">
          <JuniorMemberListPanel v-if="activeTab === 'member'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canViewChange" key="change" tab="变更记录">
          <JuniorChangeRecordPanel v-if="activeTab === 'change'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无下级成员查看权限" title="403" />
</template>
