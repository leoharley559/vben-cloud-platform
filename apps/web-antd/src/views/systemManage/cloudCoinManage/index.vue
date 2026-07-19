<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchCloudCoinDailyListApi,
  fetchCloudCoinDetailListApi,
  fetchCloudCoinStockApi,
} from '#/api/systemManage/extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  cloudCoinDailyColumns,
  cloudCoinDetailColumns,
  cloudCoinStockColumns,
} from '../shared/columns';
import CloudCoinBuyModal from './components/cloud-coin-buy-modal.vue';

defineOptions({ name: 'CloudCoinManage' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date'] as OperationListConfig['filters'];
const stockPanelKey = ref(0);

const tabs = computed(() =>
  [
    {
      config: {
        columns: cloudCoinStockColumns,
        fetchApi: fetchCloudCoinStockApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'stock',
      permission: 11426,
      tab: '库存',
    },
    {
      config: {
        columns: cloudCoinDailyColumns,
        fetchApi: fetchCloudCoinDailyListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'daily',
      permission: 11427,
      tab: '云币日报',
    },
    {
      config: {
        columns: cloudCoinDetailColumns,
        fetchApi: fetchCloudCoinDetailListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'detail',
      permission: 11428,
      tab: '消耗明细',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('stock');

function refreshStock() {
  stockPanelKey.value += 1;
}

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
          <div
            v-if="item.key === 'stock'"
            class="mb-4 flex items-center justify-between gap-3"
          >
            <div class="text-xs text-gray-400">库存明细与购买</div>
            <CloudCoinBuyModal @success="refreshStock" />
          </div>
          <OperationListPanel
            v-if="activeTab === item.key"
            :key="item.key === 'stock' ? stockPanelKey : item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无云币管理查看权限" title="403" />
</template>
