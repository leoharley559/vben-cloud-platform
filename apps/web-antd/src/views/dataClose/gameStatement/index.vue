<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchClassifiedReportListApi,
  fetchGameStatementListApi,
  fetchSubGameReportListApi,
} from '#/api/dataClose/game-statement';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { gameStatementColumns } from '../shared/columns';

defineOptions({ name: 'GameStatement' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date', 'package'] as OperationListConfig['filters'];

const tabs = computed(() =>
  [
    {
      config: {
        columns: gameStatementColumns,
        fetchApi: fetchGameStatementListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'game',
      permission: 13420,
      tab: '游戏报表',
    },
    {
      config: {
        columns: gameStatementColumns,
        fetchApi: fetchClassifiedReportListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'classified',
      permission: 13421,
      tab: '分类报表',
    },
    {
      config: {
        columns: [
          { field: 'SubGameName', minWidth: 140, title: '子游戏' },
          ...gameStatementColumns.slice(1),
        ],
        fetchApi: fetchSubGameReportListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'subGame',
      permission: 13422,
      tab: '子游戏报表',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('game');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'game';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 游戏报表"
    title="游戏报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        折线图、详情弹窗、修复日报等待下一迭代迁移。
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无游戏报表查看权限" title="403" />
</template>
