<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchEndlessAdminListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { endlessColumns } from '../shared/columns';

defineOptions({ name: 'EndlessManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: endlessColumns,
    fetchApi: fetchEndlessAdminListApi,
    filters: ['username'],
  }),
);

const canViewPage = computed(() => checkPermission(10_941));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 无限代理"
    title="无限代理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        业绩编辑、游戏配置等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无无限代理查看权限" title="403" />
</template>
