<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchCoinDealerCustomerListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { customeListColumns } from '../shared/columns';

defineOptions({ name: 'CustomeList' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: customeListColumns,
    fetchApi: fetchCoinDealerCustomerListApi,
    filters: ['username'],
  }),
);

const canViewPage = computed(() => checkPermission(10821));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 币商客服列表"
    title="币商客服列表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        排序、标签、详情编辑等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无币商客服列表查看权限" title="403" />
</template>
