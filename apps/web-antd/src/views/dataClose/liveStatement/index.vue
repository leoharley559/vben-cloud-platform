<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchAnnouncerDonateListApi,
  fetchGiftReportListApi,
  fetchGuessingGameReportListApi,
  fetchLiveDataStatisticsListApi,
  fetchLiveGameReportListApi,
  fetchLiveRoomStatisticsListApi,
  fetchPkStatisticsListApi,
} from '#/api/dataClose/live-statement';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { liveStatementColumns } from '../shared/columns';

defineOptions({ name: 'LiveStatement' });

const { checkPermission } = useCloudPermission();
const listFilters = ['date'] as OperationListConfig['filters'];

const tabs = computed(() =>
  [
    {
      config: {
        columns: liveStatementColumns,
        fetchApi: fetchLiveDataStatisticsListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'data',
      permission: 11840,
      tab: '直播数据统计',
    },
    {
      config: {
        columns: liveStatementColumns,
        fetchApi: fetchLiveRoomStatisticsListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'room',
      permission: 11841,
      tab: '直播间统计',
    },
    {
      config: {
        columns: [
          { field: 'AnnouncerName', minWidth: 120, title: '主播' },
          ...liveStatementColumns.slice(2),
        ],
        fetchApi: fetchAnnouncerDonateListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'announcer',
      permission: 12452,
      tab: '主播礼物统计',
    },
    {
      config: {
        columns: [
          { field: 'GiftName', minWidth: 120, title: '礼物名称' },
          { field: 'GiftCount', minWidth: 100, title: '数量' },
        ],
        fetchApi: fetchGiftReportListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'gift',
      permission: 12453,
      tab: '礼物报表',
    },
    {
      config: {
        columns: [
          { field: 'MatchName', minWidth: 160, title: '赛事' },
          { field: 'BetCount', minWidth: 100, title: '投注笔数' },
        ],
        fetchApi: fetchGuessingGameReportListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'guessing',
      permission: 13126,
      tab: '竞猜列表',
    },
    {
      config: {
        columns: [
          { field: 'GameName', minWidth: 140, title: '游戏' },
          { field: 'BetNum', minWidth: 100, title: '投注人数' },
        ],
        fetchApi: fetchLiveGameReportListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'liveGame',
      permission: 13129,
      tab: '直播游戏报表',
    },
    {
      config: {
        columns: [
          { field: 'PkName', minWidth: 140, title: 'PK场次' },
          { field: 'ViewCount', minWidth: 100, title: '观看人数' },
        ],
        fetchApi: fetchPkStatisticsListApi,
        filters: listFilters,
      } satisfies OperationListConfig,
      key: 'pk',
      permission: 13132,
      tab: 'PK统计',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('data');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'data';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据闭环 · 直播报表"
    title="直播报表"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        图表、详情弹窗、同步统计等待下一迭代迁移。
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
  <Result v-else status="403" sub-title="无直播报表查看权限" title="403" />
</template>
