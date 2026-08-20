<script lang="ts" setup>
import type { PanelMetricKey } from '#/utils/dashboard';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Result, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchDashboardReportApi } from '#/api/dashboard';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { normalizeReportDay, normalizeTimedMap } from '#/utils/dashboard';

import BannerStats from './components/banner-stats.vue';
import ChannelTodayTable from './components/channel-today-table.vue';
import PanelMetrics from './components/panel-metrics.vue';
import ProfitPanels from './components/profit-panels.vue';
import TodayOpsPanel from './components/today-ops-panel.vue';
import TrendChart from './components/trend-chart.vue';

defineOptions({ name: 'DashboardIndex' });

const { checkPermission } = useCloudPermission();

const canOverview = computed(() => checkPermission(10_634));
const canChannel = computed(() => checkPermission(10_636));
const canViewPage = computed(
  () => canOverview.value || canChannel.value || checkPermission(10_637),
);

const loading = ref(false);
const hideMoney = ref(localStorage.getItem('dashboardHideMoney') === '1');
const activeKey = ref<PanelMetricKey>('SumTransBetMoney1');
const chartType = ref<'bar' | 'line'>('line');

const todayStr = dayjs().format('YYYY-MM-DD');
const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

const todayRow = ref<Record<string, unknown>>({});
const yesterdayRow = ref<Record<string, unknown>>({});
const totalCount = ref<Record<string, Array<Record<string, unknown>>>>({});
const totalHours = ref<Record<string, Array<Record<string, unknown>>>>({});

async function loadReport(
  extraDates: { Date1?: string; Date2?: string; Date3?: string } = {},
) {
  if (!canOverview.value) {
    return;
  }
  loading.value = true;
  try {
    const params: Record<string, unknown> = {};
    if (extraDates.Date1) params.Date1 = extraDates.Date1;
    if (extraDates.Date2) params.Date2 = extraDates.Date2;
    if (extraDates.Date3) params.Date3 = extraDates.Date3;

    const data = (await fetchDashboardReportApi(params)) || {};
    const items = data.Items || [];
    todayRow.value =
      items.find((item) => normalizeReportDay(item.ReportDay) === todayStr) ||
      {};
    yesterdayRow.value =
      items.find(
        (item) => normalizeReportDay(item.ReportDay) === yesterdayStr,
      ) || {};
    totalCount.value = normalizeTimedMap(data.TotalCount);
    totalHours.value = normalizeTimedMap(data.TotalHours);
  } finally {
    loading.value = false;
  }
}

function onHideMoneyChange(value: boolean) {
  hideMoney.value = value;
  localStorage.setItem('dashboardHideMoney', value ? '1' : '0');
}

onMounted(() => {
  if (canOverview.value) {
    void loadReport();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据汇总 · 数据总览"
    title="数据总览"
  >
    <div class="flex flex-col gap-4 pb-4">
      <template v-if="canOverview">
        <Spin :spinning="loading">
          <div class="rounded-xl bg-card p-4 shadow-sm">
            <PanelMetrics
              :active-key="activeKey"
              :hide-money="hideMoney"
              :today="todayRow"
              :yesterday="yesterdayRow"
              @select="(key) => (activeKey = key)"
              @update:hide-money="onHideMoneyChange"
            />
            <div class="mt-4">
              <TrendChart
                :active-key="activeKey"
                :chart-type="chartType"
                :loading="loading"
                :today="todayStr"
                :total-count="totalCount"
                :total-hours="totalHours"
                :yesterday="yesterdayStr"
                @change-type="(type) => (chartType = type)"
                @reload-dates="loadReport"
              />
            </div>
          </div>
        </Spin>

        <BannerStats :today="todayRow" />

        <TodayOpsPanel />

        <ProfitPanels />
      </template>

      <ChannelTodayTable v-if="canChannel" />
    </div>
  </Page>
  <Result v-else status="403" sub-title="无数据总览查看权限" title="403" />
</template>
