<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchGameAnalysisReportApi } from '#/api/operationalData/game-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '../../operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '../../operationalManage/components/operation-list-panel.vue';
import { betAnalysisColumns } from '../shared/columns';

defineOptions({ name: 'GameDetails' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: betAnalysisColumns,
    datePreset: 'yesterday',
    dateValueFormat: 'dateString',
    fetchApi: fetchGameAnalysisReportApi,
    filters: ['date', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(12155));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 投注行为报表"
    title="投注行为报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        投注入口/场馆筛选、图表切换、导出 Excel 等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无投注行为报表查看权限" title="403" />
</template>
