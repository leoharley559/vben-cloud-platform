<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchServiceAccountListApi,
  fetchServiceSeatListApi,
  fetchServiceWorkTimeListApi,
} from '#/api/serviceManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  serviceAccountColumns,
  serviceSeatColumns,
  serviceWorkTimeColumns,
} from '../shared/columns';

defineOptions({ name: 'ServiceAccount' });

const { checkPermissionByKey } = useCloudPermission();
const activeTab = ref('account');

const tabs = computed(() =>
  [
    {
      config: {
        columns: serviceAccountColumns,
        fetchApi: fetchServiceAccountListApi,
        filters: ['username'],
        loginField: 'Username',
      } satisfies OperationListConfig,
      key: 'account',
      permissionKey: 'serviceAccountPage',
      tab: '客服帐号',
      tip: '新建/编辑账号、智能客服配置等待下一迭代迁移。',
    },
    {
      config: {
        columns: serviceSeatColumns,
        fetchApi: fetchServiceSeatListApi,
        filters: ['username'],
      } satisfies OperationListConfig,
      key: 'seat',
      permissionKey: 'serviceSeatPage',
      tab: '客服席位',
      tip: '强制下线、忙碌操作等待下一迭代迁移。',
    },
    {
      config: {
        columns: serviceWorkTimeColumns,
        fetchApi: fetchServiceWorkTimeListApi,
        filters: ['date', 'username'],
      } satisfies OperationListConfig,
      key: 'worktime',
      permissionKey: 'serviceWorkTimePage',
      tab: '工时统计',
      tip: '工时明细弹窗等待下一迭代迁移。',
    },
  ].filter((item) => checkPermissionByKey(item.permissionKey)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'account';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 账号管理"
    title="客服帐号"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
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
  <Result v-else status="403" sub-title="无客服账号查看权限" title="403" />
</template>
