<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchDataWriteListApi } from '#/api/promotion/generalize-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { dataWriteColumns } from '../shared/columns';

defineOptions({ name: 'DataWrite' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: dataWriteColumns,
    dateValueFormat: 'dateString',
    fetchApi: fetchDataWriteListApi,
    filters: ['date'],
  }),
);

const canViewPage = computed(() => checkPermission(10889));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广数据 · 数据填写"
    title="数据填写"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        新增/编辑/删除表单、落地页选择等待下一迭代迁移。
      </div>
      <OperationListPanel v-if="checkPermission(10904)" :config="listConfig" />
      <Result
        v-else
        status="403"
        sub-title="无数据填写列表查看权限"
        title="403"
      />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无数据填写查看权限" title="403" />
</template>
