<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchSportsMatchListApi } from '#/api/sportsManager/match-manager';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { matchManagerColumns } from '../shared/columns';

defineOptions({ name: 'SportsMatchManager' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: matchManagerColumns,
    fetchApi: fetchSportsMatchListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(10_541));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="体育管理 · 赛事管理（旧版已标记废弃）"
    title="赛事管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        数据来源筛选、赛事/主客场搜索、批量编辑推送、封面预览、视频播放等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无赛事管理查看权限" title="403" />
</template>
