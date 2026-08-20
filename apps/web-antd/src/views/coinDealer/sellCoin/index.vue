<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerSellPlayerListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerSellPlayerColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerSellCoin' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerSellPlayerColumns,
    fetchApi: fetchCoinDealerSellPlayerListApi,
    filters: ['login', 'date'],
  }),
);

const canViewPage = computed(
  () =>
    checkPermission(11_127) || checkPermission(10_548) || checkPermission(10_549),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 售币"
    title="售币"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        售币操作、聊天面板、赠分等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无售币查看权限" title="403" />
</template>
