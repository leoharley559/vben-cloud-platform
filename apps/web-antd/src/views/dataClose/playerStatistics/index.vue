<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchPlayerStatisticsListApi } from '#/api/dataClose/player-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { playerStatisticsColumns } from '../shared/columns';

defineOptions({ name: 'PlayerStatistics' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: playerStatisticsColumns,
    fetchApi: fetchPlayerStatisticsListApi,
    filters: ['date', 'login', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(10488));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 玩家统计报表"
    title="玩家统计报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        高级筛选、列自定义、导出 CSV 等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家统计报表查看权限" title="403" />
</template>
