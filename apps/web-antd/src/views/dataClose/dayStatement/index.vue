<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchDayStatementListApi,
  fetchDayStatementTotalListApi,
} from '#/api/dataClose/day-statement';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { statementColumns } from '../shared/columns';

defineOptions({ name: 'DayStatement' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date', 'package'] as OperationListConfig['filters'];

const tabs = computed(() =>
  [
    {
      config: {
        columns: statementColumns,
        fetchApi: fetchDayStatementTotalListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'total',
      permission: 10494,
      tab: '汇总报表',
    },
    {
      config: {
        columns: statementColumns,
        fetchApi: fetchDayStatementListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'self',
      permission: 10495,
      tab: '自营报表',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('total');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'total';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 日报表"
    title="日报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        子包网报表、展开行详情、导出等待下一迭代迁移。
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
  <Result v-else status="403" sub-title="无日报表查看权限" title="403" />
</template>
