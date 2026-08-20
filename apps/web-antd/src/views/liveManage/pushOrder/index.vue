<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPushOrderListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { pushOrderColumns } from '../shared/columns';

defineOptions({ name: 'PushOrder' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: pushOrderColumns,
    fetchApi: fetchPushOrderListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(11_589));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 推单"
    title="推单管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        新增推单、电子推单、立即结束等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无推单管理查看权限" title="403" />
</template>
