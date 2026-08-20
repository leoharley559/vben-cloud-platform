<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchServiceInlineStatListApi,
  fetchServiceSatisfactionListApi,
  fetchServiceStatisticsListApi,
} from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  serviceInlineColumns,
  serviceSatisfactionColumns,
  serviceStatisticsColumns,
} from '../shared/columns';

defineOptions({ name: 'ServiceStatistics' });

const { checkPermissionByKey } = useCloudPermission();
const activeTab = ref('supporter');

const tabs = computed(() =>
  [
    {
      config: {
        columns: serviceStatisticsColumns,
        fetchApi: fetchServiceStatisticsListApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'supporter',
      permissionKey: 'serviceStatisticsPage',
      tab: '客服统计',
      tip: '图表与导出等待下一迭代迁移。',
    },
    {
      config: {
        columns: serviceSatisfactionColumns,
        fetchApi: fetchServiceSatisfactionListApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'satisfaction',
      permissionKey: 'serviceSatisfactionPage',
      tab: '评价统计',
    },
    {
      config: {
        columns: serviceInlineColumns,
        fetchApi: fetchServiceInlineStatListApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'inline',
      permissionKey: 'serviceInlineStatPage',
      tab: '进线统计',
    },
  ].filter((item) => checkPermissionByKey(item.permissionKey)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'supporter';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 客服统计"
    title="客服统计"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
            {{ item.tip }}
          </div>
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服统计查看权限" title="403" />
</template>
