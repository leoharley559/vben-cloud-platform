<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import WhiteListPanel from './components/white-list-panel.vue';

defineOptions({ name: 'WhiteList' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      key: 'ip',
      permission: 10207,
      tab: 'IP白名单',
    },
    {
      key: 'user',
      permission: 10215,
      tab: '使用者列表',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('ip');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'ip';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 白名单设置"
    title="白名单"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <WhiteListPanel
            v-if="activeTab === item.key"
            :mode="item.key as 'ip' | 'user'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无白名单查看权限" title="403" />
</template>
