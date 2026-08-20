<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchDormantReportListApi } from '#/api/telesalesCenter/report';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { telesalesPlayerColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesDormantReport' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: telesalesPlayerColumns,
    fetchApi: fetchDormantReportListApi,
    filters: ['login', 'date', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(11_564));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 沉睡用户报表"
    title="沉睡用户报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        高级筛选、批量编辑客服、导出、脱敏等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无沉睡用户报表查看权限" title="403" />
</template>
