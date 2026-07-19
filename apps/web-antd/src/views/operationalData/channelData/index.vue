<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelReportPanel from './components/channel-report-panel.vue';

defineOptions({ name: 'ChannelData' });

const { checkPermission } = useCloudPermission();

/** 对齐旧站 channelData.vue：仅「今日数据 / 历史数据」两 Tab；代理/渠道为内层 Radio */
const tabs = computed(() =>
  [
    {
      key: 'today',
      permission: 10_662,
      searchType: 'today' as const,
      tab: '今日数据',
    },
    {
      key: 'history',
      permission: 10_663,
      searchType: 'old' as const,
      tab: '历史数据',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('today');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'today';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 代理数据"
    title="代理数据"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <ChannelReportPanel
            v-if="activeTab === item.key"
            :search-type="item.searchType"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理数据查看权限" title="403" />
</template>
