<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchLiveRoomListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { liveRoomColumns } from '../shared/columns';

defineOptions({ name: 'LiveRoomManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: liveRoomColumns,
    fetchApi: fetchLiveRoomListApi,
    filters: ['username'],
  }),
);

const canViewPage = computed(() => checkPermission(11533));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 直播间"
    title="直播间管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        置顶、热度、清晰度、观看权限等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无直播间管理查看权限" title="403" />
</template>
