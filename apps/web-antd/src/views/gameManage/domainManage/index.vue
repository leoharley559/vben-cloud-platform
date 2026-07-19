<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchDomainListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { domainColumns } from '../shared/columns';

defineOptions({ name: 'DomainManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: domainColumns,
    fetchApi: fetchDomainListApi,
    filters: [],
  }),
);

const canViewPage = computed(
  () => checkPermission(11013) || checkPermission(11012),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 域名管理"
    title="域名管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        域名注册、批量启用、配置等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无域名管理查看权限" title="403" />
</template>
