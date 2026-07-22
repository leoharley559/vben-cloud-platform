<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchDashboardReportApi,
  fetchOnlineSummaryApi,
} from '#/api/dashboard';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { normalizeReportDay, normalizeTimedMap } from '#/utils/dashboard';

import TrendChart from '../index/components/trend-chart.vue';
import OnlineCountCard from './components/online-count-card.vue';
import OnlineDistributionPanels from './components/online-distribution-panels.vue';
import OnlinePieChart from './components/online-pie-chart.vue';

defineOptions({ name: 'OnlineSummary' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig } = useGameConfig();

const canChart = computed(() => checkPermission(10_634));
const canDistribution = computed(() => checkPermission(13_197));
const canViewPage = computed(() => canChart.value || canDistribution.value);

const reportLoading = ref(false);
const summaryLoading = ref(false);

const todayStr = dayjs().format('YYYY-MM-DD');
const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

const todayRow = ref<Record<string, unknown>>({});
const yesterdayRow = ref<Record<string, unknown>>({});
const totalCount = ref<Record<string, Array<Record<string, unknown>>>>({});

const venueList = ref<Array<Record<string, unknown>>>([]);
const deviceList = ref<Array<Record<string, unknown>>>([]);
const userList = ref<Array<Record<string, unknown>>>([]);

const devicePieData = computed(() =>
  deviceList.value.map((row) => ({
    name: String(row.DevicePlatform || '-'),
    value: Number(row.Count || 0),
  })),
);

async function loadReport(
  extraDates: { Date1?: string; Date2?: string; Date3?: string } = {},
) {
  if (!canChart.value) return;
  reportLoading.value = true;
  try {
    // 对齐数据总览 / 旧站：仅透传合法自选日期，首屏无参
    const params: Record<string, unknown> = {};
    if (extraDates.Date1) params.Date1 = extraDates.Date1;
    if (extraDates.Date2) params.Date2 = extraDates.Date2;
    if (extraDates.Date3) params.Date3 = extraDates.Date3;

    const data = (await fetchDashboardReportApi(params)) || {};
    const items = Array.isArray(data.Items) ? data.Items : [];
    todayRow.value =
      items.find((item) => normalizeReportDay(item.ReportDay) === todayStr) ||
      {};
    yesterdayRow.value =
      items.find(
        (item) => normalizeReportDay(item.ReportDay) === yesterdayStr,
      ) || {};
    totalCount.value = normalizeTimedMap(data.TotalCount);
  } finally {
    reportLoading.value = false;
  }
}

async function loadSummary() {
  if (!canDistribution.value) return;
  summaryLoading.value = true;
  try {
    const data = (await fetchOnlineSummaryApi()) || {};
    // 无数据统一按 []，避免 null 进入表格/图表
    venueList.value = Array.isArray(data.GameResult) ? data.GameResult : [];
    deviceList.value = Array.isArray(data.DeviceResult)
      ? data.DeviceResult
      : [];
    userList.value = Array.isArray(data.MapResult) ? data.MapResult : [];
  } finally {
    summaryLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  if (canChart.value) void loadReport();
  if (canDistribution.value) void loadSummary();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据汇总 · 在线总览"
    title="在线总览"
  >
    <div class="flex flex-col gap-4 bg-[#f0f2f5] pb-4">
      <Spin v-if="canChart" :spinning="reportLoading">
        <div class="rounded-xl bg-white p-4 shadow-sm">
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div class="xl:col-span-3">
              <OnlineCountCard
                :loading="reportLoading"
                :today="todayRow"
                :yesterday="yesterdayRow"
              />
            </div>
            <div class="xl:col-span-5">
              <TrendChart
                active-key="SumOnlinePlayerNum"
                chart-type="line"
                :loading="reportLoading"
                :show-type-switch="false"
                :today="todayStr"
                :total-count="totalCount"
                :total-hours="{}"
                :yesterday="yesterdayStr"
                @reload-dates="loadReport"
              />
            </div>
            <div v-if="canDistribution" class="xl:col-span-4">
              <Card class="h-full shadow-sm" size="small">
                <OnlinePieChart
                  :data="devicePieData"
                  height="320px"
                  title="在线设备分布"
                />
              </Card>
            </div>
          </div>
        </div>
      </Spin>

      <OnlineDistributionPanels
        v-if="canDistribution"
        :loading="summaryLoading"
        :user-list="userList"
        :venue-list="venueList"
      />
    </div>
  </Page>
  <Result v-else status="403" sub-title="无在线总览查看权限" title="403" />
</template>
