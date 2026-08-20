<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchChannelDatasListApi } from '#/api/promotion/generalize-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { channelDatasColumns } from '../shared/columns';

defineOptions({ name: 'ChannelDatas' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: channelDatasColumns,
    dateValueFormat: 'dateString',
    fetchApi: fetchChannelDatasListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(10_901));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广数据 · 账户数据"
    title="账户数据"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        树形汇总行、汇率换算、行点击详情等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无账户数据查看权限" title="403" />
</template>
