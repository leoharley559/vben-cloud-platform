<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCallRecordListApi } from '#/api/telesalesCenter/report';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { callRecordColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesCallRecordReport' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: callRecordColumns,
    fetchApi: fetchCallRecordListApi,
    filters: ['username', 'date'],
  }),
);

const canViewPage = computed(() => checkPermission(11_517));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 通话记录报表"
    title="通话记录报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        高级筛选、录音播放、导出等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无通话记录报表查看权限" title="403" />
</template>
