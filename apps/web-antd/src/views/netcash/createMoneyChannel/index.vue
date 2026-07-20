<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import CloneChannelPanel from './components/clone-channel-panel.vue';
import MoneyChannelPanel from './components/money-channel-panel.vue';

defineOptions({ name: 'CreateMoneyChannel' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      key: 'channel',
      permission: 12_330,
      tab: '渠道管理',
    },
    {
      key: 'testChannel',
      permission: 12_491,
      tab: '测试渠道管理',
    },
    {
      key: 'clone',
      permission: 12_912,
      tab: '克隆渠道设置',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('channel');

watch(
  tabs,
  (items) => {
    if (!items.some((item) => item.key === activeTab.value)) {
      activeTab.value = items[0]?.key || 'channel';
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理渠道"
    title="代理渠道"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <MoneyChannelPanel
            v-if="activeTab === 'channel' && item.key === 'channel'"
          />
          <MoneyChannelPanel
            v-else-if="
              activeTab === 'testChannel' && item.key === 'testChannel'
            "
            is-test
          />
          <CloneChannelPanel
            v-else-if="activeTab === 'clone' && item.key === 'clone'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理渠道查看权限" title="403" />
</template>
