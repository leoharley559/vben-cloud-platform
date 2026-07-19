<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GameEmailListPanel from './components/game-email-list-panel.vue';
import GameNoticeListPanel from './components/game-notice-list-panel.vue';

defineOptions({ name: 'GameNotice' });

const { checkPermission } = useCloudPermission();

const canViewNotice = computed(() => checkPermission(10071));
const canViewEmail = computed(() => checkPermission(10072));
const canViewPage = computed(() => canViewNotice.value || canViewEmail.value);

const activeTab = ref('notice');

onMounted(() => {
  if (canViewNotice.value) {
    activeTab.value = 'notice';
  } else if (canViewEmail.value) {
    activeTab.value = 'email';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 公告管理"
    title="公告管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canViewNotice" key="notice" tab="游戏公告">
          <GameNoticeListPanel v-if="activeTab === 'notice'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canViewEmail" key="email" tab="邮件通知">
          <GameEmailListPanel v-if="activeTab === 'email'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无公告管理查看权限" title="403" />
</template>
