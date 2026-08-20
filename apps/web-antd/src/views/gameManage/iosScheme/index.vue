<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPackageListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { packageColumns } from '../shared/columns';

defineOptions({ name: 'IosScheme' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: packageColumns,
    fetchApi: fetchPackageListApi,
    filters: [],
  }),
);

const canViewPage = computed(
  () => checkPermission(12_355) || checkPermission(12_356),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · iOS方案"
    title="iOS方案"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        UniApp/iOS 方案配置等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无iOS方案查看权限" title="403" />
</template>
