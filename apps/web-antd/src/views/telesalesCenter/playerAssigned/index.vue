<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPlayerAssignedListApi } from '#/api/telesalesCenter/task';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { playerAssignedColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesPlayerAssigned' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: playerAssignedColumns,
    fetchApi: fetchPlayerAssignedListApi,
    filters: ['login', 'date'],
  }),
);

const canViewPage = computed(() => checkPermission(11_515));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 已分配玩家"
    title="已分配玩家"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        批量导入、站点成员筛选等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无已分配玩家查看权限" title="403" />
</template>
