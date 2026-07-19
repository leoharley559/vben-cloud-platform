<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerPaybackListApi } from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { coinDealerPaybackColumns } from '../shared/columns';

defineOptions({ name: 'CoinDealerReturnRecord' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: coinDealerPaybackColumns,
    fetchApi: fetchCoinDealerPaybackListApi,
    filters: ['date', 'username'],
    loginField: 'CoinDealerName',
  }),
);

const canViewPage = computed(() => checkPermission(10841));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 还款记录"
    title="还款记录"
  >
    <Card>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无还款记录查看权限" title="403" />
</template>
