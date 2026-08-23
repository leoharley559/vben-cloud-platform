<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

const props = withDefaults(
  defineProps<{
    columns?: OperationListConfig['columns'];
    description?: string;
    fetchApi?: OperationListConfig['fetchApi'];
    filters?: OperationListConfig['filters'];
    permission?: number;
    permissionKey?: string;
    placeholder?: boolean;
    tip?: string;
    title: string;
  }>(),
  {
    columns: () => [],
    description: '',
    fetchApi: undefined,
    filters: () => [],
    permission: undefined,
    permissionKey: undefined,
    placeholder: false,
    tip: '',
  },
);

const { checkPermission, checkPermissionByKey } = useCloudPermission();

const canViewPage = computed(() => {
  if (props.permissionKey) {
    return checkPermissionByKey(props.permissionKey);
  }
  if (props.permission) {
    return checkPermission(props.permission);
  }
  return true;
});

const listConfig = computed((): null | OperationListConfig => {
  if (!props.fetchApi || !props.columns?.length) {
    return null;
  }
  return {
    columns: props.columns,
    fetchApi: props.fetchApi,
    filters: props.filters,
  };
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    :description="description || `聊天室管理 · ${title}`"
    :title="title"
  >
    <Card>
      <div v-if="tip" class="mb-4 text-xs text-gray-400">
        {{ tip }}
      </div>
      <Empty v-if="placeholder" :description="`${title}待迁移`" />
      <OperationListPanel v-else-if="listConfig" :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" :sub-title="`无${title}查看权限`" title="403" />
</template>
