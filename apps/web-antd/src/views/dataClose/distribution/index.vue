<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchDistributionPayListApi,
  fetchDistributionRegListApi,
} from '#/api/dataClose/finance-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { distributionColumns } from '../shared/columns';

defineOptions({ name: 'Distribution' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date', 'package'] as OperationListConfig['filters'];

const tabs = computed(() => [
  {
    config: {
      columns: distributionColumns,
      fetchApi: fetchDistributionPayListApi,
      filters: listFilters,
    } satisfies OperationListConfig,
    key: 'pay',
    tab: '充值分布',
  },
  {
    config: {
      columns: distributionColumns,
      fetchApi: fetchDistributionRegListApi,
      filters: listFilters,
    } satisfies OperationListConfig,
    key: 'reg',
    tab: '注册分布',
  },
]);

const canViewPage = computed(() => checkPermission(10_530));
const activeTab = ref('pay');

onMounted(() => {
  activeTab.value = 'pay';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 分布统计"
    title="分布统计"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        中国地图可视化等待下一迭代迁移，当前展示地区列表。
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
  <Result v-else status="403" sub-title="无分布统计查看权限" title="403" />
</template>
