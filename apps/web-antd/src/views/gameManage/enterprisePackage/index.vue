<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchEnterpriseIosPackageListApi } from '#/api/gameManage';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { enterpriseIosColumns } from '../shared/columns';

defineOptions({ name: 'EnterprisePackage' });

const listConfig = computed(
  (): OperationListConfig => ({
    columns: enterpriseIosColumns,
    fetchApi: fetchEnterpriseIosPackageListApi,
    filters: [],
  }),
);

const canViewPage = computed(() => true);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 企业签包"
    title="企业签包"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        上传/重签企业包等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无企业签包查看权限" title="403" />
</template>
