<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import {
  fetchCoinDealerAnnouncementListApi,
  fetchCoinDealerEasyReplyGroupListApi,
  fetchCoinDealerWelcomeListApi,
} from '#/api/coinDealer';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { registerPermissionKeys } from '#/utils/permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  coinDealerAnnouncementColumns,
  coinDealerEasyReplyColumns,
  coinDealerWelcomeColumns,
} from '../shared/columns';

registerPermissionKeys({
  coinDealerMangePayment: [10454, 10602],
});

defineOptions({ name: 'CoinDealerCustomeSetting' });

const { checkPermission, checkPermissionByKey } = useCloudPermission();
const activeTab = ref('horse');

const tabs = computed(() =>
  [
    {
      key: 'profile',
      permission: 10594,
      placeholder: true,
      tab: '个人信息',
    },
    {
      config: {
        columns: coinDealerAnnouncementColumns,
        fetchApi: fetchCoinDealerAnnouncementListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'horse',
      permission: 10598,
      tab: '跑马灯',
      tip: '新建/编辑跑马灯等待下一迭代迁移。',
    },
    {
      key: 'payment',
      permissionKey: 'coinDealerMangePayment',
      placeholder: true,
      tab: '支付码',
    },
    {
      config: {
        columns: coinDealerWelcomeColumns,
        fetchApi: fetchCoinDealerWelcomeListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'welcome',
      permission: 10616,
      tab: '欢迎语',
    },
    {
      config: {
        columns: coinDealerEasyReplyColumns,
        fetchApi: fetchCoinDealerEasyReplyGroupListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'reply',
      permission: 10618,
      tab: '快捷回复',
    },
  ].filter((item) =>
    item.permissionKey
      ? checkPermissionByKey(item.permissionKey)
      : checkPermission(item.permission!),
  ),
);

const canViewPage = computed(
  () =>
    tabs.value.length > 0 ||
    checkPermission(10599) ||
    checkPermission(11135) ||
    checkPermission(10617),
);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'horse';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 客服设置"
    title="客服设置"
  >
    <Card>
      <Tabs
        v-if="tabs.length"
        v-model:active-key="activeTab"
        type="line"
        size="small"
      >
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.placeholder">
            <div class="mb-4 text-xs text-gray-400">
              {{ item.tab }}表单等待下一迭代迁移。
            </div>
            <Empty :description="`${item.tab}待迁移`" />
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
      <Empty v-else description="暂无可用设置项" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服设置查看权限" title="403" />
</template>
