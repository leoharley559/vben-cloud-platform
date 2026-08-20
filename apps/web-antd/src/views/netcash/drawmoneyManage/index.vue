<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BlacklistPanel from './components/blacklist-panel.vue';
import ChannelPanel from './components/channel-panel.vue';
import ThirdChannelPanel from './components/third-channel-panel.vue';
import WithdrawListPanel from './components/withdraw-list-panel.vue';

defineOptions({ name: 'DrawmoneyManage' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    { key: 'drawings', label: '提款列表', permission: 10_156 },
    { key: 'black', label: '提款黑名单', permission: 10_157 },
    { key: 'channel', label: '提款通道管理', permission: 11_696 },
    { key: 'third', label: '第三方支付通道管理', permission: 10_980 },
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
    description="代理网赚 · 提款管理"
    title="提款管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.label">
          <WithdrawListPanel
            v-if="activeTab === 'drawings' && item.key === 'drawings'"
          />
          <BlacklistPanel
            v-else-if="activeTab === 'black' && item.key === 'black'"
          />
          <ChannelPanel
            v-else-if="activeTab === 'channel' && item.key === 'channel'"
          />
          <ThirdChannelPanel
            v-else-if="activeTab === 'third' && item.key === 'third'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无提款管理查看权限" title="403" />
</template>
