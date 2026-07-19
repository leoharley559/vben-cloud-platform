<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchLegacyRoleListApi } from '#/api/systemManage/extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { roleColumns } from '../shared/columns';

defineOptions({ name: 'SystemRole' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: roleColumns,
    fetchApi: fetchLegacyRoleListApi,
    filters: [],
  }),
);

const canViewPage = computed(
  () => checkPermission(10000) || checkPermission(10001),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="系统管理 · 角色管理"
    title="角色管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        旧版角色页仅保留列表只读；节点授权请使用「新角色管理」（newRole）。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无角色管理查看权限" title="403" />
</template>
