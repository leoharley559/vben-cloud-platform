<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchLiveEventListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { liveEventColumns } from '../shared/columns';

defineOptions({ name: 'LiveEvent' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: liveEventColumns,
    fetchApi: fetchLiveEventListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(13_026));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 活动"
    title="直播活动"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        活动模板、历史记录等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无直播活动查看权限" title="403" />
</template>
