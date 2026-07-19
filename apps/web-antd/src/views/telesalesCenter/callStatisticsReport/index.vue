<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCallStatisticsListApi } from '#/api/telesalesCenter/report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { callStatisticsColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesCallStatisticsReport' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: callStatisticsColumns,
    fetchApi: fetchCallStatisticsListApi,
    filters: ['username', 'date'],
  }),
);

const canViewPage = computed(() => checkPermission(11516));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 通话统计报表"
    title="通话统计报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        高级筛选、导出等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无通话统计报表查看权限" title="403" />
</template>
