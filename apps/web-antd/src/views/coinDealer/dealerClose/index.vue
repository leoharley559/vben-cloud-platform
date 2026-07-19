<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchCoinDealerListApi,
  fetchCoinDealerPaybackListApi,
  fetchCoinDealerSellListApi,
} from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  coinDealerAccountColumns,
  coinDealerPaybackColumns,
  coinDealerSellColumns,
} from '../shared/columns';

defineOptions({ name: 'CoinDealerClose' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date', 'username'] as OperationListConfig['filters'];

const tabs = computed(() =>
  [
    {
      config: {
        columns: coinDealerAccountColumns,
        fetchApi: fetchCoinDealerListApi,
        filters: ['username'],
        loginField: 'Username',
      } satisfies OperationListConfig,
      key: 'sellReturn',
      permission: 10839,
      tab: '授信/还款',
      tip: '授信/还款表单、谷歌验证等待下一迭代迁移。',
    },
    {
      config: {
        columns: coinDealerSellColumns,
        fetchApi: fetchCoinDealerSellListApi,
        filters: listFilters,
        loginField: 'CoinDealerName',
      } satisfies OperationListConfig,
      key: 'sellRecord',
      permission: 10840,
      tab: '授信记录',
    },
    {
      config: {
        columns: coinDealerPaybackColumns,
        fetchApi: fetchCoinDealerPaybackListApi,
        filters: listFilters,
        loginField: 'CoinDealerName',
      } satisfies OperationListConfig,
      key: 'returnRecord',
      permission: 10841,
      tab: '还款记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('sellReturn');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'sellReturn';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 授信结算"
    title="授信结算"
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
  <Result v-else status="403" sub-title="无授信结算查看权限" title="403" />
</template>
