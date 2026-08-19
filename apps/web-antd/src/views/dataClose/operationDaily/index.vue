<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import DataComparePanel from './components/data-compare-panel.vue';
import IncomeAnalyzePanel from './components/income-panel.vue';
import OperationDailyPanel from './components/operation-daily-panel.vue';
import PromotionAnalyzePanel from './components/promotion-panel.vue';

defineOptions({ name: 'OperationDaily' });

const { checkPermission } = useCloudPermission();

/**
 * 对齐旧站 operationDaily.vue Tab + 权限。
 * 游戏分析 189、数据报表 12358 旧站已注释，不展示。
 */
const tabs = computed(() =>
  [
    {
      component: DataComparePanel,
      key: 'compare',
      show: checkPermission(10_515),
      tab: '数据比较',
    },
    {
      component: OperationDailyPanel,
      key: 'daily',
      show: checkPermission(11_225),
      tab: '运营日报',
    },
    {
      component: IncomeAnalyzePanel,
      key: 'income',
      show: checkPermission(10_516),
      tab: '收入分析',
    },
    {
      component: PromotionAnalyzePanel,
      key: 'promotion',
      show: checkPermission(10_517),
      tab: '推广分析',
    },
  ].filter((item) => item.show),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('');

/** 旧站 created 优先顺序：比较 → 收入 → 推广 → 日报 */
const TAB_PRIORITY = ['compare', 'income', 'promotion', 'daily'];

watchEffect(() => {
  const keys = tabs.value.map((item) => item.key);
  if (!keys.includes(activeTab.value)) {
    activeTab.value =
      TAB_PRIORITY.find((key) => keys.includes(key)) || keys[0] || '';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 数据比较 / 运营日报 / 收入与推广分析"
    title="数据分析"
  >
    <Card class="operation-daily-card" size="small">
      <Tabs v-model:active-key="activeTab" size="small" type="line">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无数据分析查看权限" title="403" />
</template>

<style scoped>
.operation-daily-card :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
</style>
