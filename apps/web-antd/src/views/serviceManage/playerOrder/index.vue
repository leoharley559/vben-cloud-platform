<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPlayerOrderListApi } from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { playerOrderColumns } from '../shared/columns';

defineOptions({ name: 'ServicePlayerOrder' });

const { checkPermissionByKey } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: playerOrderColumns,
    fetchApi: fetchPlayerOrderListApi,
    filters: ['date', 'login'],
  }),
);

const canViewPage = computed(() => checkPermissionByKey('servicePlayerOrder'));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 玩家工单"
    title="玩家工单"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        处理/驳回工单、问题类型设置等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家工单查看权限" title="403" />
</template>
