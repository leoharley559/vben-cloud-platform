<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchGuessThemeListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { guessColumns } from '../shared/columns';

defineOptions({ name: 'GuessingManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: guessColumns,
    fetchApi: fetchGuessThemeListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(13_051));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 竞猜"
    title="竞猜管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        玩法配置、派彩记录等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无竞猜管理查看权限" title="403" />
</template>
