<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchTaskListApi } from '#/api/telesalesCenter/task';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { taskListColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesTaskList' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: taskListColumns,
    dateFieldKeys: { begin: 'BeginCreateTime', end: 'EndCreateTime' },
    fetchApi: fetchTaskListApi,
    filters: ['date', 'login'],
  }),
);

const canViewPage = computed(() => checkPermission(11514));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 任务列表"
    title="任务列表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        任务分配、停止、删除及分配详情 Tab 等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无任务列表查看权限" title="403" />
</template>
