<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchNewRegisterNoDepositListApi } from '#/api/telesalesCenter/report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { telesalesPlayerColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesNewRegisterNoDepositReport' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: telesalesPlayerColumns,
    fetchApi: fetchNewRegisterNoDepositListApi,
    filters: ['login', 'date', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(11556));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 新注册未存款报表"
    title="新注册未存款报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        高级筛选、批量编辑客服、导出、脱敏等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result
    v-else
    status="403"
    sub-title="无新注册未存款报表查看权限"
    title="403"
  />
</template>
