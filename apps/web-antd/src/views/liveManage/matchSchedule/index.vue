<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchMatchScheduleListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { matchScheduleColumns } from '../shared/columns';

defineOptions({ name: 'MatchSchedule' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: matchScheduleColumns,
    fetchApi: fetchMatchScheduleListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(11_532));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 赛程"
    title="赛程列表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        聊天室开关、批量操作等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无赛程列表查看权限" title="403" />
</template>
