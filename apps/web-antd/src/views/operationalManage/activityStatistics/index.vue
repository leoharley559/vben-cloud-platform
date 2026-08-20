<script lang="ts" setup>
import type { OperationListConfig } from '../components/operation-list-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchActivityFirstPaySummaryApi,
  fetchActivitySummaryApi,
  fetchActivityVisitListApi,
  fetchActivityVisitStatisticsApi,
  fetchLuckyDrawInfoListApi,
} from '#/api/operationManage/activity-statistics';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import OperationListPanel from '../components/operation-list-panel.vue';

defineOptions({ name: 'ActivityStatistics' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('visit');

const visitColumns: OperationListConfig['columns'] = [
  {
    field: 'LoginAccount',
    minWidth: 120,
    slot: 'loginAccount',
    title: '游戏账号',
  },
  { field: 'PackageName', minWidth: 120, title: '产品包' },
  {
    field: 'VisitTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '访问时间',
  },
  { field: 'EntranceName', minWidth: 120, title: '访问入口' },
];

const summaryColumns: OperationListConfig['columns'] = [
  { field: 'ActivityName', minWidth: 140, title: '活动' },
  { field: 'VisitNum', minWidth: 90, title: '访问' },
  { field: 'ApplyNum', minWidth: 90, title: '申请' },
  { field: 'RewardNum', minWidth: 90, title: '发放' },
];

const tabs = computed(() =>
  [
    {
      config: {
        columns: visitColumns,
        fetchApi: fetchActivityVisitListApi,
        filters: ['login', 'package', 'date'],
      } satisfies OperationListConfig,
      key: 'visit',
      permission: 11_990,
      tab: '访问明细',
    },
    {
      config: {
        columns: summaryColumns,
        fetchApi: fetchActivityVisitStatisticsApi,
        filters: ['date', 'package'],
      } satisfies OperationListConfig,
      key: 'visitStat',
      permission: 11_991,
      tab: '访问统计',
    },
    {
      config: {
        columns: summaryColumns,
        fetchApi: fetchActivitySummaryApi,
        filters: ['date', 'package'],
      } satisfies OperationListConfig,
      key: 'summary',
      permission: 11_992,
      tab: '活动汇总',
    },
    {
      config: {
        columns: summaryColumns,
        fetchApi: fetchActivityFirstPaySummaryApi,
        filters: ['date', 'package'],
      } satisfies OperationListConfig,
      key: 'firstPay',
      permission: 11_993,
      tab: '首存汇总',
    },
    {
      config: {
        columns: [
          {
            field: 'LoginAccount',
            minWidth: 120,
            slot: 'loginAccount',
            title: '游戏账号',
          },
          { field: 'PrizeName', minWidth: 120, title: '奖品' },
          {
            field: 'CreateTime',
            formatter: (value) => formatOperationDateTime(value as string),
            minWidth: 160,
            title: '时间',
          },
        ],
        fetchApi: fetchLuckyDrawInfoListApi,
        filters: ['login', 'date'],
      } satisfies OperationListConfig,
      key: 'lucky',
      permission: 11_994,
      tab: '抽奖明细',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(
  () =>
    tabs.value.length > 0 ||
    checkPermission(11_990) ||
    checkPermission(12_008) ||
    checkPermission(11_968),
);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'visit';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 活动统计"
    title="活动统计"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        各活动类型专项统计子页等待下一迭代迁移；可从活动列表进入详情统计。
      </div>
      <Tabs
        v-if="tabs.length > 0"
        v-model:active-key="activeTab"
        type="line"
        size="small"
      >
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          >
            <template #loginAccount="{ row }">
              <PlayerAccountLink
                :login-account="String(row.LoginAccount || '')"
                :player-id="row.PlayerId as number | string | undefined"
              />
            </template>
          </OperationListPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无活动统计查看权限" title="403" />
</template>
