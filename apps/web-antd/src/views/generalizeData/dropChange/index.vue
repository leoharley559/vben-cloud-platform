<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchDropChangeListApi } from '#/api/promotion/generalize-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { dropChangeColumns } from '../shared/columns';

defineOptions({ name: 'DropChange' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: dropChangeColumns,
    dateValueFormat: 'dateString',
    fetchApi: fetchDropChangeListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(10_887));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广数据 · 落地页转化"
    title="落地页转化"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        导出 Excel、落地页筛选等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无落地页转化查看权限" title="403" />
</template>
