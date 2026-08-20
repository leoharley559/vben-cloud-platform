<script lang="ts" setup>
import type { TimeshareHourItem } from '#/types/promotion';
import type { TimeshareChartType, TimeshareMetricKey } from '#/utils/timeshare-data';

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
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { TIMESHARE_METRIC_MAP } from '#/utils/timeshare-data';

import TimesharePanel from './components/timeshare-panel.vue';

defineOptions({ name: 'TimeshareData' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

/** 对齐旧站 getBeforeDateStr(7)～getBeforeDateStr(0)：近 7 个自然日（含今天） */
const defaultBegin = dayjs().subtract(6, 'day');
const defaultEnd = dayjs();
/** 对齐旧站 SearchTypeOne limit-number=7 */
const MAX_RANGE_DAYS = 7;

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
let latestRequestId = 0;

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
  metricOrder.filter((metric) => canViewMetric(metric)),
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
  if (end.startOf('day').diff(begin.startOf('day'), 'day') > MAX_RANGE_DAYS) {
    message.warning('日期范围最多选择 7 天');
    return;
  }
  const requestId = ++latestRequestId;
  loading.value = true;
  try {
    const result = await fetchTimeshareDataApi(getQueryParams());
    if (requestId !== latestRequestId) return;
    rawData.value = Array.isArray(result.Items) ? result.Items : [];
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
    <Card size="small" :loading="loading">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">代理账号</span>
            <AccountSelect v-model="filterAdminIds" />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">渠道</span>
            <ChannelSelect
              v-model="filterChannelIds"
              placeholder="请输入渠道号"
            />
          </Space.Compact>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker
              v-model="filterDateRange"
              label="日期"
              precision="date"
              :max-range-days="MAX_RANGE_DAYS"
            />
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="loadData">查询</Button>
            <Button @click="reset">重置</Button>
          </div>
        </div>
      </div>
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="text-xs text-gray-500">*图表每小时记录一次</div>
        <Radio.Group
          v-model:value="chartType"
          button-style="solid"
          size="small"
        >
          <Radio.Button title="点击切换柱形图" value="bar">柱状图</Radio.Button>
          <Radio.Button title="点击切换折线图" value="line">
折线图
</Radio.Button>
          <Radio.Button title="点击切换表格" value="table">表格</Radio.Button>
        </Radio.Group>
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
