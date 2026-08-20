<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import {
  fetchAiAssistantListApi,
  fetchAudioEffectListApi,
  fetchBlackListApi,
  fetchEasyReplyListApi,
  fetchEvaluationLabelListApi,
  fetchFilterWordListApi,
  fetchPlayerMarkListApi,
  fetchQuestionTypeListApi,
} from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  aiAssistantColumns,
  audioEffectColumns,
  blackListColumns,
  easyReplyColumns,
  evaluationLabelColumns,
  filterWordColumns,
  playerMarkColumns,
  questionTypeColumns,
} from '../shared/columns';

defineOptions({ name: 'ServiceSetting' });

const { checkPermissionByKey } = useCloudPermission();
const activeTab = ref('words');

const tabs = computed(() =>
  [
    {
      config: {
        columns: easyReplyColumns,
        fetchApi: fetchEasyReplyListApi,
        filters: ['username'],
      } satisfies OperationListConfig,
      key: 'words',
      permissionKey: 'serviceCommonWords',
      tab: '常用语',
      tip: '分类管理、导入导出等待下一迭代迁移。',
    },
    {
      config: {
        columns: aiAssistantColumns,
        fetchApi: fetchAiAssistantListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'ai',
      permissionKey: 'serviceAiAssistant',
      tab: 'AI助手',
    },
    {
      config: {
        columns: questionTypeColumns,
        fetchApi: fetchQuestionTypeListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'quest',
      permissionKey: 'serviceQuestionType',
      tab: '问题类型',
    },
    {
      config: {
        columns: evaluationLabelColumns,
        fetchApi: fetchEvaluationLabelListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'label',
      permissionKey: 'serviceEvalLabel',
      tab: '评价标签',
    },
    {
      key: 'autoreply',
      permissionKey: 'serviceAutoReply',
      placeholder: true,
      tab: '自动回复',
    },
    {
      config: {
        columns: blackListColumns,
        fetchApi: fetchBlackListApi,
        filters: ['login'],
      } satisfies OperationListConfig,
      key: 'blacklist',
      permissionKey: 'serviceBlackListSetting',
      tab: '黑名单',
    },
    {
      config: {
        columns: playerMarkColumns,
        fetchApi: fetchPlayerMarkListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'mark',
      permissionKey: 'servicePlayerMark',
      tab: '玩家标记',
    },
    {
      config: {
        columns: filterWordColumns,
        fetchApi: fetchFilterWordListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'filter',
      permissionKey: 'serviceFilterWord',
      tab: '敏感词',
    },
    {
      config: {
        columns: audioEffectColumns,
        fetchApi: fetchAudioEffectListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'audio',
      permissionKey: 'serviceAudioEffect',
      tab: '音效',
    },
    {
      key: 'other',
      permissionKey: 'serviceOtherSetting',
      placeholder: true,
      tab: '其他设置',
    },
  ].filter((item) => checkPermissionByKey(item.permissionKey)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'words';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 客服设置"
    title="客服设置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.placeholder">
            <div class="mb-4 text-xs text-gray-400">
              表单配置等待下一迭代迁移。
            </div>
            <Empty :description="`${item.tab} 配置待迁移`" />
          </template>
          <template v-else>
            <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
              {{ item.tip }}
            </div>
            <OperationListPanel
              v-if="activeTab === item.key && item.config"
              :config="item.config"
            />
          </template>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服设置查看权限" title="403" />
</template>
