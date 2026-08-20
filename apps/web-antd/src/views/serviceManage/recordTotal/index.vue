<script lang="ts" setup>
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchServiceRecordListApi,
  fetchServiceReturnListApi,
} from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';

import { serviceRecordColumns } from '../shared/columns';
import EnterLineMonitorPanel from './components/enter-line-monitor-panel.vue';

defineOptions({ name: 'ServiceRecordTotal' });

const { checkPermissionByKey } = useCloudPermission();
const listFilters = ['date', 'username'] as OperationListConfig['filters'];
const activeTab = ref('enter');

const tabs = computed(() =>
  [
    {
      key: 'monitor',
      permissionKey: 'serviceMonitorPage',
      tab: '进线监控',
      ws: true,
    },
    {
      config: {
        columns: serviceRecordColumns,
        fetchApi: fetchServiceRecordListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'enter',
      permissionKey: 'serviceEnterLineRecord',
      tab: '进线记录',
      tip: '详情、问题类型修改、导出等待下一迭代迁移。',
    },
    {
      config: {
        columns: serviceRecordColumns,
        fetchApi: fetchServiceReturnListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'return',
      permissionKey: 'serviceReturnRecord',
      tab: '回收站',
    },
    {
      config: {
        columns: serviceRecordColumns,
        fetchApi: fetchServiceRecordListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'miss',
      permissionKey: 'serviceMissRecord',
      tab: '错过记录',
      tip: '错过记录筛选参数与旧站对齐待下一迭代细化。',
    },
  ].filter((item) => checkPermissionByKey(item.permissionKey)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'enter';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 进线记录"
    title="进线记录"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.ws">
            <EnterLineMonitorPanel v-if="activeTab === item.key" />
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
  <Result v-else status="403" sub-title="无进线记录查看权限" title="403" />
</template>
