<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPlayerAnalyzeListApi } from '#/api/dataClose/player-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { playerAnalyzeColumns } from '../shared/columns';

defineOptions({ name: 'PlayerAnalyze' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: playerAnalyzeColumns,
    fetchApi: fetchPlayerAnalyzeListApi,
    filters: ['date', 'login', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(10522));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 玩家分析"
    title="玩家分析"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        玩家状态编辑、详情弹窗等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家分析查看权限" title="403" />
</template>
