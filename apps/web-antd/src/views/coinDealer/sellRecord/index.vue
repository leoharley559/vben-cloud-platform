<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerSellListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerSellColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerSellRecord' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerSellColumns,
    fetchApi: fetchCoinDealerSellListApi,
    filters: ['date', 'username'],
    loginField: 'CoinDealerName',
  }),
);

const canViewPage = computed(
  () => checkPermission(10_840) && checkPermission(11_131),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 授信记录"
    title="授信记录"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        汇总统计、导出等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无授信记录查看权限" title="403" />
</template>
