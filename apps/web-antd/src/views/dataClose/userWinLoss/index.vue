<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchUserWinLossListApi } from '#/api/dataClose/player-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { userWinLossColumns } from '../shared/columns';

defineOptions({ name: 'UserWinLoss' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: userWinLossColumns,
    fetchApi: fetchUserWinLossListApi,
    filters: ['date', 'login', 'package'],
  }),
);

const canViewPage = computed(() => checkPermission(10492));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 玩家输赢"
    title="玩家输赢"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        汇总统计卡片、场馆模版筛选、导出等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家输赢查看权限" title="403" />
</template>
