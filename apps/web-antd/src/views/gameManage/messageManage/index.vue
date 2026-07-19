<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import {
  fetchDepositRecallListApi,
  fetchMessageServiceListApi,
  fetchRegOtpDetailListApi,
  fetchSmsChannelConfigListApi,
  fetchSmsMonthListApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import {
  depositRecallColumns,
  messageServiceColumns,
  otpDetailColumns,
  smsChannelColumns,
  smsMonthColumns,
} from '../shared/columns';

defineOptions({ name: 'MessageManage' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('overview');

const tabs = computed(() =>
  [
    {
      config: {
        columns: messageServiceColumns,
        fetchApi: fetchMessageServiceListApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'overview',
      permission: 10930,
      tab: '短信总览',
      tip: '购买短信、自动补货等待下一迭代迁移。',
    },
    {
      config: {
        columns: smsMonthColumns,
        fetchApi: fetchSmsMonthListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'month',
      permission: 10931,
      tab: '月度统计',
    },
    {
      config: {
        columns: smsChannelColumns,
        fetchApi: fetchSmsChannelConfigListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'channel',
      permission: 12906,
      tab: '通道配置',
    },
    {
      key: 'template',
      permission: 13239,
      placeholder: true,
      tab: '短信模板',
    },
    {
      config: {
        columns: otpDetailColumns,
        fetchApi: fetchRegOtpDetailListApi,
        filters: ['date'],
      } satisfies OperationListConfig,
      key: 'otp',
      permission: 13372,
      tab: '注册OTP明细',
    },
    {
      config: {
        columns: depositRecallColumns,
        fetchApi: fetchDepositRecallListApi,
        filters: ['date', 'login'],
      } satisfies OperationListConfig,
      key: 'regRecall',
      permission: 13408,
      tab: '注册次日召回',
    },
    {
      config: {
        columns: depositRecallColumns,
        fetchApi: fetchDepositRecallListApi,
        filters: ['date', 'login'],
      } satisfies OperationListConfig,
      key: 'depositRecall',
      permission: 13414,
      tab: '首存次日召回',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'overview';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 短信管理"
    title="短信管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
            {{ item.tip }}
          </div>
          <Empty
            v-if="item.placeholder"
            :description="`${item.tab}等待下一迭代迁移`"
          />
          <OperationListPanel
            v-else-if="activeTab === item.key && item.config"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无短信管理查看权限" title="403" />
</template>
