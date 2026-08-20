<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card } from 'ant-design-vue';

import { fetchDepositWithdrawalDiffListApi } from '#/api/dataClose/finance-report';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { depositWithdrawalColumns } from '../shared/columns';

defineOptions({ name: 'DepositWithdrawalDiff' });

const listConfig = computed(
  (): OperationListConfig => ({
    columns: depositWithdrawalColumns,
    fetchApi: fetchDepositWithdrawalDiffListApi,
    filters: ['date', 'login', 'package'],
  }),
);
</script>

<template>
  <Page
    auto-content-height
    description="数据闭环 · 会员存提差报表"
    title="会员存提差报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        汇总行、导出 Excel 等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
</template>
