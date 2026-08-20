<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchAiKnowledgeListApi } from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { aiKnowledgeColumns } from '../shared/columns';

defineOptions({ name: 'AiKnowledgeBaseManager' });

const { checkPermissionByKey } = useCloudPermission();

const listConfig = computed(
  (): OperationListConfig => ({
    columns: aiKnowledgeColumns,
    fetchApi: fetchAiKnowledgeListApi,
    filters: ['username'],
  }),
);

const canViewPage = computed(() => checkPermissionByKey('serviceAiKnowledge'));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · AI 知识库"
    title="AI 知识库"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        新建/编辑问答、扩展搜索等待下一迭代迁移。
      </div>
      <OperationListPanel :config="listConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无 AI 知识库查看权限" title="403" />
</template>
