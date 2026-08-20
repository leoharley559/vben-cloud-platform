<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerAccountColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerSellReturn' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerAccountColumns,
    fetchApi: fetchCoinDealerListApi,
    filters: ['username'],
    loginField: 'Username',
  }),
);

const canViewPage = computed(() => checkPermission(10_839));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 授信/还款"
    title="授信/还款"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        授信/还款操作弹窗、二次验证等待下一迭代迁移，当前展示币商列表。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无授信/还款查看权限" title="403" />
</template>
