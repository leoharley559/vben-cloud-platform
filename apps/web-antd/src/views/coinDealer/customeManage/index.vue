<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerCustomerListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerAccountColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerCustomeManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerAccountColumns,
    fetchApi: fetchCoinDealerCustomerListApi,
    filters: ['login', 'date'],
    loginField: 'PlayerName',
  }),
);

const canViewPage = computed(() => checkPermission(350));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 客户管理"
    title="客户管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        聊天记录、状态筛选等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客户管理查看权限" title="403" />
</template>
