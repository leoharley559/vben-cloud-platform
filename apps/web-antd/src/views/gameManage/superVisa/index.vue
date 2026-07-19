<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchIosSignatureListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { iosSignatureColumns } from '../shared/columns';

defineOptions({ name: 'SuperVisa' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: iosSignatureColumns,
    fetchApi: fetchIosSignatureListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(
  () => checkPermission(10952) || checkPermission(10953),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 超级签证"
    title="超级签证"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        概览购买、消耗明细等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无超级签证查看权限" title="403" />
</template>
