<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchEndlessAgentByTimeListApi,
  fetchEndlessAgentByUserListApi,
  fetchEndlessAgentMultipleListApi,
} from '#/api/operationalData/endless-agent';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '../../operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '../../operationalManage/components/operation-list-panel.vue';
import { endlessAgentColumns } from '../shared/columns';

defineOptions({ name: 'EndlessAgent' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      config: {
        columns: endlessAgentColumns,
        datePreset: 'last31ToYesterday',
        fetchApi: fetchEndlessAgentMultipleListApi,
        filters: ['date', 'package'],
      } satisfies OperationListConfig,
      key: 'multiple',
      permission: 10718,
      tab: '层级查询',
    },
    {
      config: {
        columns: endlessAgentColumns,
        datePreset: 'last31ToYesterday',
        fetchApi: fetchEndlessAgentByUserListApi,
        filters: ['date', 'login'],
      } satisfies OperationListConfig,
      key: 'byUser',
      permission: 10723,
      tab: '按用户明细',
    },
    {
      config: {
        columns: endlessAgentColumns,
        datePreset: 'last31ToYesterday',
        fetchApi: fetchEndlessAgentByTimeListApi,
        filters: ['date', 'login'],
      } satisfies OperationListConfig,
      key: 'byTime',
      permission: 10723,
      tab: '按时间明细',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('multiple');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'multiple';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 无限代理数据"
    title="无限代理数据"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        层级面包屑、统计卡片、导出 Excel 等待下一迭代迁移。
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无无限代理数据查看权限" title="403" />
</template>
