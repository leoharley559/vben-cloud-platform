<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchLtvListApi } from '#/api/dataClose/ltv';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

defineOptions({ name: 'DataCloseLtv' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: [
      { field: 'ChannelName', minWidth: 120, title: '渠道' },
      { field: 'PackageName', minWidth: 120, title: '产品包' },
      { field: 'RegNum', minWidth: 90, title: '注册' },
      { field: 'PayNum', minWidth: 90, title: '付费人数' },
      { field: 'PayMoney', minWidth: 110, title: '付费金额' },
      { field: 'Ltv', minWidth: 90, title: 'LTV' },
    ],
    dateValueFormat: 'dateString',
    fetchApi: fetchLtvListApi,
    filters: ['date', 'package'],
  }),
);

const canViewPage = computed(
  () =>
    checkPermission(10520) || checkPermission(10521) || checkPermission(10494),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · LTV"
    title="LTV"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        图表、明细下钻等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无 LTV 查看权限" title="403" />
</template>
