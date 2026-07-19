<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchOperationDailyWinRankApi } from '#/api/dataClose/operation-daily';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { operationDailyWinColumns } from '../shared/columns';

defineOptions({ name: 'OperationDaily' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      config: null,
      key: 'compare',
      permission: 10515,
      tab: '数据比较',
      tip: '日/月数据比较看板（核心数据、收入、拓展活力等）待下一迭代迁移。',
    },
    {
      config: {
        columns: operationDailyWinColumns,
        extraQuery: { ReportType: 1 },
        fetchApi: fetchOperationDailyWinRankApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'daily',
      permission: 11225,
      tab: '运营日报',
      tip: '小时对比、公司收入、游戏盈亏图表待下一迭代迁移。',
    },
    {
      config: null,
      key: 'income',
      permission: 10516,
      tab: '收入分析',
      tip: '收入分析图表待下一迭代迁移。',
    },
    {
      config: null,
      key: 'promotion',
      permission: 10517,
      tab: '推广分析',
      tip: '推广分析图表待下一迭代迁移。',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('compare');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'compare';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 运营日报"
    title="运营日报"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div
            v-if="item.tip && activeTab === item.key"
            class="mb-4 text-xs text-gray-400"
          >
            {{ item.tip }}
          </div>
          <OperationListPanel
            v-if="item.config && activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无运营日报查看权限" title="403" />
</template>
