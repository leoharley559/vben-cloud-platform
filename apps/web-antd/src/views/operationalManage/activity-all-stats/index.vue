<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchActivityFirstPaySummaryApi,
  fetchActivityVisitListApi,
  fetchActivityVisitStatisticsApi,
  fetchLuckyDrawInfoListApi,
} from '#/api/operationManage/activity-statistics';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import OperationListPanel from '../components/operation-list-panel.vue';
import type { OperationListConfig } from '../components/operation-list-panel.vue';

defineOptions({ name: 'ActivityAllStats' });

const VISIT_ACTIVITY_TYPES = new Set([
  10002, 10006, 10007, 10008, 10009, 10013, 10015,
]);
const ACTIVITY_FIRST_PAY = 10006;
const LUCKY_DRAW = 10008;

const route = useRoute();
const { checkPermission } = useCloudPermission();

const activityId = computed(() => String(route.query.Id || ''));
const activityName = computed(() => String(route.query.Name || ''));
const activityType = computed(() => Number(route.query.Type || 0));

const baseExtraQuery = computed(() => ({
  ActivityId: activityId.value,
}));

const visitDetailConfig = computed(
  (): OperationListConfig => ({
    columns: [
      { field: 'LoginAccount', title: '游戏账号' },
      { field: 'PackageName', title: '产品包' },
      {
        field: 'VisitTime',
        formatter: (value) => formatOperationDateTime(value as string),
        title: '访问时间',
      },
      { field: 'EntranceName', title: '访问入口' },
      { field: 'DevicePlatformName', title: '设备类型' },
      { field: 'VipLevel', title: 'VIP等级' },
    ],
    extraQuery: baseExtraQuery.value,
    fetchApi: fetchActivityVisitListApi,
    filters: ['login', 'package', 'date'],
  }),
);

const visitStatisticsConfig = computed(
  (): OperationListConfig => ({
    columns: [
      { field: 'EntranceName', title: '访问入口' },
      { field: 'TotalVisit', title: '总访问人次' },
      { field: 'WebVisit', title: 'WEB' },
      { field: 'H5Visit', title: 'H5' },
      { field: 'IosVisit', title: 'IOS' },
      { field: 'AndroidVisit', title: 'Android' },
    ],
    extraQuery: baseExtraQuery.value,
    fetchApi: fetchActivityVisitStatisticsApi,
    filters: ['date'],
  }),
);

const firstPayConfig = computed(
  (): OperationListConfig => ({
    columns: [
      { field: 'LoginAccount', title: '游戏账号' },
      { field: 'PackageName', title: '产品包' },
      { field: 'FirstPayAmount', title: '首存金额' },
      { field: 'BonusAmount', title: '彩金金额' },
      {
        field: 'CreateTime',
        formatter: (value) => formatOperationDateTime(value as string),
        title: '参与时间',
      },
    ],
    extraQuery: baseExtraQuery.value,
    fetchApi: fetchActivityFirstPaySummaryApi,
    filters: ['login', 'package', 'date'],
  }),
);

const luckyDrawConfig = computed(
  (): OperationListConfig => ({
    columns: [
      { field: 'LoginAccount', title: '游戏账号' },
      { field: 'PackageName', title: '产品包' },
      { field: 'PrizeName', title: '奖品名称' },
      {
        field: 'DrawTime',
        formatter: (value) => formatOperationDateTime(value as string),
        title: '抽奖时间',
      },
    ],
    extraQuery: baseExtraQuery.value,
    fetchApi: fetchLuckyDrawInfoListApi,
    filters: ['login', 'package', 'date'],
  }),
);

const tabs = computed(() => {
  const type = activityType.value;
  const hasVisitTabs = VISIT_ACTIVITY_TYPES.has(type);

  return [
    hasVisitTabs && checkPermission(11936)
      ? {
          config: visitDetailConfig.value,
          key: 'details',
          tab: '访问明细',
        }
      : null,
    hasVisitTabs && checkPermission(11932)
      ? {
          config: visitStatisticsConfig.value,
          key: 'statistics',
          tab: '访问统计',
        }
      : null,
    type === ACTIVITY_FIRST_PAY && checkPermission(13111)
      ? {
          config: firstPayConfig.value,
          key: 'firstPaySummary',
          tab: '活动详情',
        }
      : null,
    type === LUCKY_DRAW && checkPermission(11995)
      ? {
          config: luckyDrawConfig.value,
          key: 'luckyDraw',
          tab: '抽奖记录',
        }
      : null,
  ].filter(Boolean) as Array<{
    config: OperationListConfig;
    key: string;
    tab: string;
  }>;
});

const canViewPage = computed(() => tabs.value.length > 0 && !!activityId.value);
const activeTab = ref('details');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'details';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    :description="`活动类型: ${activityType} · ID: ${activityId}`"
    :title="`活动统计 - ${activityName || activityId}`"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        按活动类型展示的更多统计
        Tab（每日任务、复活礼包、风控记录等）待下一迭代迁移。
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
  <Result
    v-else
    status="403"
    sub-title="缺少活动参数、类型不支持或无查看权限"
    title="无法访问"
  />
</template>
