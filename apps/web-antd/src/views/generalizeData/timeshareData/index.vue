<script lang="ts" setup>
import type { TimeshareHourItem } from '#/types/promotion';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  message,
  Radio,
  Result,
  Space,
  Tabs,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTimeshareDataApi } from '#/api/promotion/timeshare-data';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
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

const defaultBegin = dayjs().subtract(6, 'day');
const defaultEnd = dayjs();

const loading = ref(false);
const chartType = ref<TimeshareChartType>('bar');
const activeTab = ref<TimeshareMetricKey>('addNumber');
const filterAdminIds = ref<Array<number | string>>([]);
const filterChannelIds = ref<Array<number | string>>([]);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const rawData = ref<TimeshareHourItem[][]>([]);
const rangeSelecting = ref<dayjs.Dayjs>();
let latestRequestId = 0;

function disabledDate(current: dayjs.Dayjs) {
  if (!rangeSelecting.value) return false;
  const min = rangeSelecting.value.subtract(6, 'day');
  const max = rangeSelecting.value.add(6, 'day');
  return current.isBefore(min, 'day') || current.isAfter(max, 'day');
}

function onCalendarChange(
  dates: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  const first = dates?.[0];
  rangeSelecting.value = first
    ? dayjs.isDayjs(first)
      ? first
      : dayjs(first)
    : undefined;
}

const realAdminType = computed(() => {
  const parentInfo = projectConfig.value?.ParentInfo as
    | undefined
    | { AdminType?: number };
  return parentInfo?.AdminType;
});

function canViewMetric(metric: TimeshareMetricKey) {
  // 对齐旧站：仅 AdminType===2 做功能权限裁剪；1 及其它类型展示全部 Tab
  if (realAdminType.value !== 2) {
    return true;
  }
  if (metric === 'addPayMoney' || metric === 'addPayNum') {
    return checkPermission(10_882) && checkPermission(10_883);
  }
  if (metric === 'addExchangeMoney' || metric === 'addExchangeNum') {
    return checkPermission(10_884) && checkPermission(10_885);
  }
  return checkPermission(TIMESHARE_METRIC_MAP[metric].permission);
}

const metricOrder: TimeshareMetricKey[] = [
  'addNumber',
  'addDevice',
  'allLogin',
  'addPayMoney',
  'addPayNum',
  'addExchangeMoney',
  'addExchangeNum',
];
const visibleTabs = computed(() =>
  metricOrder.filter((metric) =>
    canViewMetric(metric),
  ),
);

const canViewPage = computed(() => visibleTabs.value.length > 0);

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminId: filterAdminIds.value.join(','),
    BeginTime: begin
      ? begin.format('YYYY-MM-DD')
      : defaultBegin.format('YYYY-MM-DD'),
    ChannelId: filterChannelIds.value.join(','),
    EndTime: end ? end.format('YYYY-MM-DD') : defaultEnd.format('YYYY-MM-DD'),
  };
}

async function loadData() {
  const [begin, end] = filterDateRange.value || [];
  if (!begin || !end) {
    message.warning('请选择日期范围');
    return;
  }
  if (end.diff(begin, 'day') > 6) {
    message.warning('日期范围最多选择 7 天');
    return;
  }
  const requestId = ++latestRequestId;
  loading.value = true;
  try {
    const result = await fetchTimeshareDataApi(getQueryParams());
    if (requestId !== latestRequestId) return;
    rawData.value = Array.isArray(result.Items) ? result.Items : [];
    if (rawData.value.length === 0) {
      message.info('暂无数据');
    }
  } catch {
    if (requestId === latestRequestId) {
      rawData.value = [];
    }
  } finally {
    if (requestId === latestRequestId) loading.value = false;
  }
}

function reset() {
  filterAdminIds.value = [];
  filterChannelIds.value = [];
  filterDateRange.value = [defaultBegin, defaultEnd];
  loadData();
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

watch(visibleTabs, (tabs) => {
  if (!tabs.includes(activeTab.value)) {
    activeTab.value = tabs[0] || 'addNumber';
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
    <Card :loading="loading" class="timeshare-card" :bordered="false">
      <div class="timeshare-query">
        <div class="query-field">
          <span>推广账号</span>
          <Space.Compact>
            <span class="query-field-addon">账号</span>
            <AccountSelect v-model="filterAdminIds" style="width: 240px" />
          </Space.Compact>
        </div>
        <div class="query-field">
          <span>渠道</span>
          <Space.Compact>
            <span class="query-field-addon">渠道号</span>
            <ChannelSelect v-model="filterChannelIds" style="width: 240px" placeholder="请输入渠道号" />
          </Space.Compact>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" precision="date" :disabled-date="disabledDate" />
        </div>
        <Button type="primary" @click="loadData">查询</Button>
        <Button @click="reset">重置</Button>
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

<style scoped>
.timeshare-card {
  min-height: calc(100vh - 180px);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
}

.timeshare-query {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 14px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-field {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
