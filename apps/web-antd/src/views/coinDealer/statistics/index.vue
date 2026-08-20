<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerStatisticsListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerStatisticsColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerStatistics' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerStatisticsColumns,
    fetchApi: fetchCoinDealerStatisticsListApi,
    filters: ['date', 'username'],
  }),
);

const canViewPage = computed(
  () => checkPermission(10_443) || checkPermission(10_441),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 客服统计"
    title="客服统计"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">图表、导出等待下一迭代迁移。</div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服统计查看权限" title="403" />
</template>
