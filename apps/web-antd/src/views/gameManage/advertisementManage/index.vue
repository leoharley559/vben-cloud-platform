<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchAdTemplateListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { adTemplateColumns } from '../shared/columns';

defineOptions({ name: 'AdvertisementManage' });

const { checkPermission } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: adTemplateColumns,
    fetchApi: fetchAdTemplateListApi,
    filters: [],
  }),
);

const canViewPage = computed(
  () => checkPermission(11027) || checkPermission(11028),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 广告管理"
    title="广告管理"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        多广告位方案编辑等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无广告管理查看权限" title="403" />
</template>
