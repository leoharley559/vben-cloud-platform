<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import DailyPanel from './components/daily-panel.vue';
import DetailPanel from './components/detail-panel.vue';
import StockPanel from './components/stock-panel.vue';

defineOptions({ name: 'CloudCoinManage' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      key: 'stock',
      permission: 11426,
      tab: '库存',
    },
    {
      key: 'daily',
      permission: 11427,
      tab: '云币日报',
    },
    {
      key: 'detail',
      permission: 11428,
      tab: '消耗明细',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('stock');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'stock';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="系统管理 · 云币管理"
    title="云币管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <StockPanel v-if="item.key === 'stock' && activeTab === 'stock'" />
          <DailyPanel
            v-else-if="item.key === 'daily' && activeTab === 'daily'"
          />
          <DetailPanel
            v-else-if="item.key === 'detail' && activeTab === 'detail'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无云币管理查看权限" title="403" />
</template>
