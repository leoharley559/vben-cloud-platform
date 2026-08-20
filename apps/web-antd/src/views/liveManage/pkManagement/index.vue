<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPkListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { pkColumns } from '../shared/columns';

defineOptions({ name: 'PkManagement' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: pkColumns,
    fetchApi: fetchPkListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(13_070));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · PK"
    title="PK管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        审核、战力、方案设置等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无PK管理查看权限" title="403" />
</template>
