<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchLandingPageListApi } from '#/api/liveManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { landingPageColumns } from '../shared/columns';

defineOptions({ name: 'LandingPage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: landingPageColumns,
    fetchApi: fetchLandingPageListApi,
    filters: [],
  }),
);

const canViewPage = computed(() => checkPermission(11602));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="直播管理 · 落地页"
    title="落地页"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        新增/编辑落地页表单等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无落地页查看权限" title="403" />
</template>
