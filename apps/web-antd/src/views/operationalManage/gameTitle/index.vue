<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GameTitleGroupList from '../../memberManage/gameTitleManagement/components/game-title-group-list.vue';
import GameTitleList from '../../memberManage/gameTitleManagement/components/game-title-list.vue';

defineOptions({ name: 'GameTitle' });

const { checkPermission } = useCloudPermission();

const canTitle = computed(() => checkPermission(13_135));
const canGroup = computed(() => checkPermission(13_136));
const canViewPage = computed(() => canTitle.value || canGroup.value);

const activeTab = ref('title');

function resolveDefaultTab() {
  const tabs = [
    { key: 'title', visible: canTitle.value },
    { key: 'group', visible: canGroup.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'title';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 称号管理"
    title="称号管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canTitle" key="title" tab="称号管理">
          <GameTitleList v-if="activeTab === 'title'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canGroup" key="group" tab="称号类别">
          <GameTitleGroupList v-if="activeTab === 'group'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无称号管理查看权限" title="403" />
</template>
