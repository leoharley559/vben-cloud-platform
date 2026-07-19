<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Statistic, Tabs } from 'ant-design-vue';

import {
  fetchGoldInventoryApi,
  fetchGoldSellRecordListApi,
} from '#/api/systemManage/extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { goldSellRecordColumns } from '../shared/columns';
import GoldSellPanel from './components/gold-sell-panel.vue';

defineOptions({ name: 'GoldManage' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('inventory');
const inventoryLoading = ref(false);
const banner = ref<Record<string, unknown>>({});

const recordConfig = {
  columns: goldSellRecordColumns,
  fetchApi: fetchGoldSellRecordListApi,
  filters: ['date', 'username'],
  loginField: 'AgentName',
} satisfies OperationListConfig;

const tabs = computed(() =>
  [
    {
      key: 'inventory',
      permission: 11423,
      tab: '库存',
    },
    {
      key: 'sell',
      permission: 11424,
      tab: '授信',
    },
    {
      key: 'record',
      permission: 11425,
      tab: '授信记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

async function loadInventory() {
  inventoryLoading.value = true;
  try {
    const result = await fetchGoldInventoryApi({ Page: 1, PageSize: 20 });
    const more = (result.MoreItems || {}) as Record<string, unknown>;
    banner.value = {
      ...(more.BannerScoreChange as Record<string, unknown>),
      ...(more.BannerScoreCount as Record<string, unknown>),
    };
  } finally {
    inventoryLoading.value = false;
  }
}

function openSellRecord(agentName: string) {
  activeTab.value = 'record';
  if (agentName) {
    // 记录页通过 username 筛选；切换后由用户可再搜一次
  }
}

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'inventory';
  if (checkPermission(11423)) {
    void loadInventory();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="系统管理 · 金币管理"
    title="金币管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.key === 'inventory'">
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card size="small">
                <Statistic
                  :loading="inventoryLoading"
                  :value="Number(banner.AvailScores || 0)"
                  title="剩余库存"
                />
              </Card>
              <Card size="small">
                <Statistic
                  :loading="inventoryLoading"
                  :value="Number(banner.IncomeScores || 0)"
                  title="今日入库"
                />
              </Card>
              <Card size="small">
                <Statistic
                  :loading="inventoryLoading"
                  :value="Number(banner.OutCoinDealerScores || 0)"
                  title="今日出库(币商)"
                />
              </Card>
              <Card size="small">
                <Statistic
                  :loading="inventoryLoading"
                  :value="Number(banner.OutAgentScores || 0)"
                  title="今日出库(代理)"
                />
              </Card>
            </div>
          </template>
          <GoldSellPanel
            v-else-if="item.key === 'sell' && activeTab === 'sell'"
            @look-record="openSellRecord"
          />
          <OperationListPanel
            v-else-if="item.key === 'record' && activeTab === 'record'"
            :config="recordConfig"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无金币管理查看权限" title="403" />
</template>
