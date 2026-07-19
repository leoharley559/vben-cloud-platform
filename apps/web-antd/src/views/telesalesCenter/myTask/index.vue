<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchMyTaskDetailListApi,
  fetchMyTaskListApi,
} from '#/api/telesalesCenter/task';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { myTaskDetailColumns, myTaskListColumns } from '../shared/columns';

defineOptions({ name: 'TelesalesMyTask' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('list');

const canViewList = computed(() => checkPermission(11509));
const canViewDetail = computed(() => checkPermission(11518));
const canViewPage = computed(() => canViewList.value || canViewDetail.value);

const tabs = computed(() => {
  const items: Array<{
    config: OperationListConfig;
    key: string;
    tab: string;
  }> = [];
  if (canViewList.value) {
    items.push({
      config: {
        columns: myTaskListColumns,
        fetchApi: fetchMyTaskListApi,
        filters: ['date'],
      },
      key: 'list',
      tab: '任务列表',
    });
  }
  if (canViewDetail.value) {
    items.push({
      config: {
        columns: myTaskDetailColumns,
        fetchApi: fetchMyTaskDetailListApi,
        filters: ['login', 'date'],
      },
      key: 'detail',
      tab: '任务详情',
    });
  }
  return items;
});

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'list';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="电销中心 · 我的任务"
    title="我的任务"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        VOIP 呼叫、回访记录、行销结果编辑等待下一迭代迁移。
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
  <Result v-else status="403" sub-title="无我的任务查看权限" title="403" />
</template>
