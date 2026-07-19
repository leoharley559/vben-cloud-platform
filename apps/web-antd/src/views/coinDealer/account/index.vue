<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import {
  fetchCoinDealerListApi,
  fetchCoinDealerWorkTimeListApi,
} from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  coinDealerAccountColumns,
  coinDealerWorkTimeColumns,
} from '../shared/columns';

defineOptions({ name: 'CoinDealerAccount' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('account');

const tabs = computed(() =>
  [
    {
      config: {
        columns: coinDealerAccountColumns,
        fetchApi: fetchCoinDealerListApi,
        filters: ['username'],
        loginField: 'Username',
      } satisfies OperationListConfig,
      key: 'account',
      permission: 10452,
      tab: '币商账号',
      tip: '新建/编辑、支付码绑定等待下一迭代迁移。',
    },
    {
      key: 'common',
      permission: 10452,
      placeholder: true,
      tab: '通用设置',
    },
    {
      config: {
        columns: coinDealerWorkTimeColumns,
        fetchApi: fetchCoinDealerWorkTimeListApi,
        filters: ['date', 'username'],
      } satisfies OperationListConfig,
      key: 'worktime',
      permission: 10452,
      tab: '工时统计',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'account';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 账号管理"
    title="币商账号"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.placeholder">
            <div class="mb-4 text-xs text-gray-400">
              通用设置表单等待下一迭代迁移。
            </div>
            <Empty description="通用设置待迁移" />
          </template>
          <template v-else>
            <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
              {{ item.tip }}
            </div>
            <OperationListPanel
              v-if="activeTab === item.key && item.config"
              :config="item.config"
            />
          </template>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无币商账号查看权限" title="403" />
</template>
