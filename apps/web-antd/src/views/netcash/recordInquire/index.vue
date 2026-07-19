<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchRecordAdjustListApi,
  fetchRecordBackwaterListApi,
  fetchRecordBonusListApi,
  fetchRecordDepositListApi,
  fetchRecordGameListApi,
  fetchRecordLoginListApi,
  fetchRecordWithdrawListApi,
} from '#/api/netcash/record-inquire';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import RecordQueryPanel from './components/record-query-panel.vue';
import type { RecordQueryPanelConfig } from './components/record-query-panel.vue';

defineOptions({ name: 'RecordInquire' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      key: 'account',
      permission: 10174,
      tab: '账号调整',
      config: {
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'PackageName', title: '产品包' },
          {
            field: 'Amount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '调整金额',
          },
        ],
        fetchApi: fetchRecordAdjustListApi,
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'deposit',
      permission: 10175,
      tab: '会员存款',
      config: {
        amountField: 'RealAmountTotal',
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'PackageName', title: '产品包' },
          {
            field: 'RealAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '存款金额',
          },
        ],
        fetchApi: fetchRecordDepositListApi,
        summaryField: 'RealAmountTotal',
        summaryTitle: '存款总计',
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'login',
      permission: 10176,
      tab: '登录',
      config: {
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'PackageName', title: '产品包' },
          { field: 'LoginIP', title: '登录IP' },
        ],
        fetchApi: fetchRecordLoginListApi,
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'withdraw',
      permission: 10177,
      tab: '提款',
      config: {
        amountField: 'RealAmountTotal',
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'RealAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '提款金额',
          },
        ],
        fetchApi: fetchRecordWithdrawListApi,
        summaryField: 'RealAmountTotal',
        summaryTitle: '提款总计',
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'bonus',
      permission: 10178,
      tab: '红利',
      config: {
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'RealAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '红利金额',
          },
        ],
        fetchApi: fetchRecordBonusListApi,
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'backwater',
      permission: 10179,
      tab: '返水',
      config: {
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          {
            field: 'RealAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '返水金额',
          },
        ],
        fetchApi: fetchRecordBackwaterListApi,
      } satisfies RecordQueryPanelConfig,
    },
    {
      key: 'game',
      permission: 10180,
      tab: '游戏',
      config: {
        columns: [
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '时间',
          },
          { field: 'LoginAccount', title: '游戏账号' },
          { field: 'AgentAccount', title: '代理账号' },
          { field: 'GameName', title: '游戏' },
          {
            field: 'BetAmount',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '投注金额',
          },
        ],
        fetchApi: fetchRecordGameListApi,
      } satisfies RecordQueryPanelConfig,
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('account');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'account';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 记录查询"
    title="记录查询"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <RecordQueryPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无记录查询查看权限" title="403" />
</template>
