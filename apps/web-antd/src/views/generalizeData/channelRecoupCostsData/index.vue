<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card } from 'ant-design-vue';

import { fetchChannelRecoupCostsListApi } from '#/api/promotion/generalize-data';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { channelRecoupColumns } from '../shared/columns';

defineOptions({ name: 'ChannelRecoupCostsData' });

const listConfig = computed(
  (): OperationListConfig => ({
    columns: channelRecoupColumns,
    dateValueFormat: 'dateString',
    extraQuery: { IsTotal: false, ReportType: 2, Type: 1 },
    fetchApi: fetchChannelRecoupCostsListApi,
    filters: ['date'],
  }),
);
</script>

<template>
  <Page
    auto-content-height
    description="推广数据 · 渠道回本数据"
    title="渠道回本数据"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        日/周/月报切换、指标类型切换、动态回本列矩阵等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
</template>
