<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchAutoAssignConfigListApi,
  fetchSalesCategoryListApi,
  fetchSeatListApi,
  fetchServiceProviderListApi,
} from '#/api/telesalesCenter/config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  autoAssignConfigColumns,
  salesCategoryColumns,
  seatListColumns,
  serviceProviderColumns,
} from '../shared/columns';

defineOptions({ name: 'TelesalesConfigManagement' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('call');

const canViewCall = computed(() => checkPermission(11_513));
const canViewSeat = computed(() => checkPermission(11_520));
const canViewSales = computed(() => checkPermission(11_521));
const canViewProvider = computed(() => checkPermission(11_522));
const canViewPage = computed(
  () =>
    canViewCall.value ||
    canViewSeat.value ||
    canViewSales.value ||
    canViewProvider.value,
);

const tabs = computed(() => {
  const items: Array<{
    config: OperationListConfig;
    key: string;
    tab: string;
  }> = [];
  if (canViewCall.value) {
    items.push({
      config: {
        columns: autoAssignConfigColumns,
        fetchApi: fetchAutoAssignConfigListApi,
        filters: [],
      },
      key: 'call',
      tab: '呼叫配置',
    });
  }
  if (canViewSeat.value) {
    items.push({
      config: {
        columns: seatListColumns,
        fetchApi: fetchSeatListApi,
        filters: ['username'],
      },
      key: 'seat',
      tab: '坐席管理',
    });
  }
  if (canViewSales.value) {
    items.push({
      config: {
        columns: salesCategoryColumns,
        fetchApi: fetchSalesCategoryListApi,
        filters: [],
      },
      key: 'sales',
      tab: '行销结果',
    });
  }
  if (canViewProvider.value) {
    items.push({
      config: {
        columns: serviceProviderColumns,
        fetchApi: fetchServiceProviderListApi,
        filters: [],
      },
      key: 'provider',
      tab: '服务商',
    });
  }
  return items;
});

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'call';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 配置管理"
    title="配置管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        自动分配规则编辑、坐席绑定、服务商表单等待下一迭代迁移。
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
  <Result v-else status="403" sub-title="无配置管理查看权限" title="403" />
</template>
