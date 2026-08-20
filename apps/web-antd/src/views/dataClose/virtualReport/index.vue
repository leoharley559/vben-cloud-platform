<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchVirtualReportTaskListApi } from '#/api/dataClose/virtual-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { virtualReportColumns } from '../shared/columns';

defineOptions({ name: 'VirtualReport' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: virtualReportColumns,
    fetchApi: fetchVirtualReportTaskListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(12_597));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 虚拟报表"
    title="虚拟报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        创建/编辑任务、暂停/重启操作等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无虚拟报表查看权限" title="403" />
</template>
