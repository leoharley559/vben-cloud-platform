<script lang="ts" setup>
import type { TimeshareHourItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Radio,
  Result,
  Tabs,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTimeshareDataApi } from '#/api/promotion/timeshare-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  TIMESHARE_METRIC_MAP,
  type TimeshareChartType,
  type TimeshareMetricKey,
} from '#/utils/timeshare-data';

import TimesharePanel from './components/timeshare-panel.vue';

defineOptions({ name: 'TimeshareData' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const defaultBegin = dayjs().subtract(7, 'day');
const defaultEnd = dayjs();

const loading = ref(false);
const chartType = ref<TimeshareChartType>('bar');
const activeTab = ref<TimeshareMetricKey>('addNumber');
const filterAdminId = ref('');
const filterChannelId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const rawData = ref<TimeshareHourItem[][]>([]);

const realAdminType = computed(() => {
  const parentInfo = projectConfig.value?.ParentInfo as
    | { AdminType?: number }
    | undefined;
  return Number(parentInfo?.AdminType || 0);
});

function canViewMetric(metric: TimeshareMetricKey) {
  const permission = TIMESHARE_METRIC_MAP[metric].permission;
  if (realAdminType.value !== 2) {
    return true;
  }
  return checkPermission(permission);
}

const visibleTabs = computed(() =>
  (Object.keys(TIMESHARE_METRIC_MAP) as TimeshareMetricKey[]).filter((metric) =>
    canViewMetric(metric),
  ),
);

const canViewPage = computed(() => visibleTabs.value.length > 0);

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminId: filterAdminId.value,
    BeginTime: begin
      ? begin.format('YYYY-MM-DD')
      : defaultBegin.format('YYYY-MM-DD'),
    ChannelId: filterChannelId.value,
    EndTime: end ? end.format('YYYY-MM-DD') : defaultEnd.format('YYYY-MM-DD'),
  };
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchTimeshareDataApi(getQueryParams());
    rawData.value = result.Items || [];
    if (!rawData.value.length) {
      message.info('暂无数据');
    }
  } finally {
    loading.value = false;
  }
}

function resolveDefaultTab() {
  activeTab.value = visibleTabs.value[0] || 'addNumber';
}

onMounted(() => {
  resolveDefaultTab();
  if (canViewPage.value) {
    loadData();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广数据 · 时段报表"
    title="时段报表"
  >
    <Card :loading="loading">
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterAdminId"
          allow-clear
          placeholder="推广账号 ID"
          style="width: 180px"
        />
        <Input
          v-model:value="filterChannelId"
          allow-clear
          placeholder="渠道 ID"
          style="width: 180px"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Button type="primary" @click="loadData">查询</Button>
        <div class="ml-auto">
          <Radio.Group v-model:value="chartType" button-style="solid">
            <Radio.Button value="bar">柱状图</Radio.Button>
            <Radio.Button value="line">折线图</Radio.Button>
            <Radio.Button value="table">表格</Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <div class="mb-3 text-xs text-gray-500">
        * 日期范围最多 7 天，按小时维度展示各指标趋势
      </div>

      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane
          v-for="metric in visibleTabs"
          :key="metric"
          :tab="TIMESHARE_METRIC_MAP[metric].label"
        >
          <TimesharePanel
            v-if="activeTab === metric"
            :chart-type="chartType"
            :data="rawData"
            :metric="metric"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无时段报表查看权限" title="403" />
</template>
