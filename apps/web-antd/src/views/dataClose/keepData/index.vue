<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchKeepDataExtantListApi,
  fetchKeepDataLoginRetentionListApi,
  fetchKeepDataLtvListApi,
  fetchKeepDataOneTimeUserListApi,
  fetchKeepDataSectionRetentionListApi,
} from '#/api/dataClose/keep-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { keepDataUserColumns } from '../shared/columns';

defineOptions({ name: 'KeepData' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date', 'package'] as OperationListConfig['filters'];

const tabs = computed(() =>
  [
    {
      config: {
        columns: keepDataUserColumns,
        fetchApi: fetchKeepDataExtantListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'extant',
      permission: 10526,
      tab: '留存',
      tip: '矩阵留存表完整展示待下一迭代迁移，当前为列表预览。',
    },
    {
      config: {
        columns: keepDataUserColumns,
        fetchApi: fetchKeepDataLoginRetentionListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'login',
      permission: 10527,
      tab: '登录留存',
      tip: '登录留存矩阵表待下一迭代迁移。',
    },
    {
      config: {
        columns: keepDataUserColumns,
        fetchApi: fetchKeepDataSectionRetentionListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'section',
      permission: 10528,
      tab: '区间留存',
      tip: '区间留存矩阵表待下一迭代迁移。',
    },
    {
      config: {
        columns: keepDataUserColumns,
        fetchApi: fetchKeepDataLtvListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'ltv',
      permission: 10529,
      tab: 'LTV数据',
      tip: 'LTV 矩阵表待下一迭代迁移。',
    },
    {
      config: {
        columns: keepDataUserColumns,
        fetchApi: fetchKeepDataOneTimeUserListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'oneTime',
      tab: '一次性用户',
    },
  ].filter((item) => !item.permission || checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('extant');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'extant';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 留存数据"
    title="留存数据"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div
            v-if="item.tip && activeTab === item.key"
            class="mb-4 text-xs text-gray-400"
          >
            {{ item.tip }}
          </div>
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无留存数据查看权限" title="403" />
</template>
