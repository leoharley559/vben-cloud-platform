<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchStreamerListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { streamerColumns } from '../shared/columns';

defineOptions({ name: 'StreamerManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: streamerColumns,
    fetchApi: fetchStreamerListApi,
    filters: ['username'],
  }),
);

const canViewPage = computed(() => checkPermission(11535));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 主播"
    title="主播管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        助手/管理账号/组别 Tab 等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无主播管理查看权限" title="403" />
</template>
