<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Button, DatePicker, Popover, Space } from 'ant-design-vue';
import { type Dayjs } from 'dayjs';

import {
  CHART_COLORS,
  normalizeReportDay,
  PANEL_METRICS,
  type PanelMetricKey,
} from '#/utils/dashboard';

defineOptions({ name: 'DashboardTrendChart' });

const props = defineProps<{
  activeKey: PanelMetricKey;
  chartType: 'bar' | 'line';
  loading?: boolean;
  /** 是否展示折线/柱状切换；在线总览旧站仅折线，默认 true */
  showTypeSwitch?: boolean;
  today: string;
  totalCount: Record<string, Array<Record<string, unknown>>>;
  totalHours: Record<string, Array<Record<string, unknown>>>;
  yesterday: string;
}>();

const emit = defineEmits<{
  'change-type': [type: 'bar' | 'line'];
  'reload-dates': [dates: { Date1?: string; Date2?: string; Date3?: string }];
}>();

const showTypeSwitch = computed(() => props.showTypeSwitch !== false);

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

const date1 = ref<Dayjs>();
const date2 = ref<Dayjs>();
const date3 = ref<Dayjs>();
const popoverOpen = ref(false);

const hourAxis = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const fiveMinAxis: string[] = [];
for (let h = 0; h < 24; h += 1) {
  for (let m = 0; m < 60; m += 5) {
    fiveMinAxis.push(`${h}:${String(m).padStart(2, '0')}`);
  }
}

const activeMetric = computed(
  () =>
    PANEL_METRICS.find((item) => item.key === props.activeKey) ||
    PANEL_METRICS[1]!,
);

function resolveDayRows(
  source: Record<string, Array<Record<string, unknown>>>,
  dateKey: string,
) {
  if (!source || !dateKey) {
    return [];
  }
  if (source[dateKey]?.length) {
    return source[dateKey]!;
  }
  const normalizedTarget = normalizeReportDay(dateKey);
  const matched = Object.entries(source).find(([key, rows]) => {
    if (!rows?.length) return false;
    const normalizedKey = normalizeReportDay(key);
    return (
      key === dateKey ||
      normalizedKey === dateKey ||
      normalizedKey === normalizedTarget ||
      key.startsWith(dateKey) ||
      key.startsWith(normalizedTarget)
    );
  });
  return matched?.[1] || [];
}

function calcPointValue(row: Record<string, unknown>) {
  let val = activeMetric.value.calc(row);
  if (activeMetric.value.key === 'SumOnlinePlayerNum' && val < 0) {
    val = 0;
  }
  if (activeMetric.value.hasDigits) {
    val = val / 100;
  }
  return Number(val.toFixed(2));
}

/** 按 Hours 字段对齐到 0~23；无 Hours 时退回数组顺序 */
function buildHourValues(rows: Array<Record<string, unknown>>) {
  const hasHours = rows.some(
    (row) => row.Hours !== undefined && row.Hours !== null && row.Hours !== '',
  );
  if (!hasHours) {
    return rows.map((row) => calcPointValue(row));
  }
  const values: Array<null | number> = Array.from({ length: 24 }, () => null);
  for (const row of rows) {
    const hour = Number(row.Hours);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    values[hour] = calcPointValue(row);
  }
  return values;
}

const legendDates = computed(() => {
  const hours = props.totalHours || {};
  const list = [
    { date: props.today, label: '今日' },
    { date: props.yesterday, label: '昨日' },
  ];
  const seen = new Set(
    list.map((item) => normalizeReportDay(item.date) || item.date),
  );
  Object.keys(hours).forEach((dateKey) => {
    const normalized = normalizeReportDay(dateKey) || dateKey;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      list.push({ date: normalized, label: normalized });
    }
  });
  return list;
});

const chartSource = computed(() =>
  props.activeKey === 'SumOnlinePlayerNum'
    ? props.totalCount
    : props.totalHours,
);

const hasChartData = computed(() =>
  legendDates.value.some(
    (item) => resolveDayRows(chartSource.value, item.date).length > 0,
  ),
);

const emptyHint = computed(() =>
  props.activeKey === 'SumOnlinePlayerNum'
    ? '暂无分时数据：接口 TotalCount 为空或为 null（在线人数卡片来自 Items 日汇总，与折线 5 分钟点不是同一字段）'
    : '暂无分时数据：接口 TotalHours 为空或为 null（上方卡片来自 Items 日汇总，与折线分时数据不是同一字段）',
);

async function renderChart() {
  await nextTick();
  if (props.loading || !hasChartData.value) {
    return;
  }

  const isOnline = props.activeKey === 'SumOnlinePlayerNum';
  const source = chartSource.value;
  const xData = isOnline ? fiveMinAxis : hourAxis;

  const series = legendDates.value.map((item, index) => {
    const rows = resolveDayRows(source, item.date);
    // 在线人数：接口按 5 分钟顺序返回完整点，与旧站一致按序映射
    // 分时指标：按 Hours 对齐到 0~23
    const values = isOnline
      ? rows.map((row) => calcPointValue(row))
      : buildHourValues(rows);
    return {
      connectNulls: false,
      data: values,
      itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
      name: item.label,
      showSymbol: !isOnline,
      smooth: false,
      symbol: isOnline ? 'none' : 'circle',
      symbolSize: 6,
      type: props.chartType,
    };
  });

  await renderEcharts({
    animationDuration: 600,
    color: CHART_COLORS,
    grid: {
      bottom: 28,
      containLabel: true,
      left: 16,
      right: 16,
      top: 56,
    },
    legend: {
      data: legendDates.value.map((item) => item.label),
      top: 8,
    },
    series,
    title: {
      left: 8,
      text: activeMetric.value.label,
      textStyle: { fontSize: 14, fontWeight: 500 },
      top: 8,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      boundaryGap: props.chartType === 'bar',
      data: xData,
      type: 'category',
    },
    yAxis: {
      scale: false,
      type: 'value',
    },
  });

  // Spin / 布局完成后补一次 resize，避免高度为 0 时画布空白
  await nextTick();
  resize();
  window.setTimeout(() => resize(), 120);
}

function confirmDates() {
  popoverOpen.value = false;
  const payload: { Date1?: string; Date2?: string; Date3?: string } = {};
  const candidates = [
    { key: 'Date1' as const, value: date1.value },
    { key: 'Date2' as const, value: date2.value },
    { key: 'Date3' as const, value: date3.value },
  ];
  for (const item of candidates) {
    if (!item.value) continue;
    const formatted = item.value.format('YYYY-MM-DD');
    if (formatted < props.today && formatted !== props.yesterday) {
      payload[item.key] = formatted;
    }
  }
  emit('reload-dates', payload);
}

watch(
  () =>
    [
      props.activeKey,
      props.chartType,
      props.totalCount,
      props.totalHours,
      props.today,
      props.yesterday,
      props.loading,
    ] as const,
  ([, , , , , , loading]) => {
    if (!loading) {
      void renderChart();
    }
  },
  { deep: true, flush: 'post' },
);

onMounted(() => {
  window.setTimeout(() => {
    void renderChart();
  }, 80);
});
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
      <Space>
        <template v-if="showTypeSwitch">
          <Button
            :type="chartType === 'line' ? 'primary' : 'default'"
            size="small"
            @click="emit('change-type', 'line')"
          >
            折线图
          </Button>
          <Button
            :type="chartType === 'bar' ? 'primary' : 'default'"
            size="small"
            @click="emit('change-type', 'bar')"
          >
            柱状图
          </Button>
        </template>
        <Popover
          v-model:open="popoverOpen"
          placement="bottomRight"
          trigger="click"
        >
          <template #content>
            <div class="flex w-56 flex-col gap-2">
              <div>
                <div class="mb-1 text-xs text-gray-500">日期1</div>
                <DatePicker v-model:value="date1" class="w-full" />
              </div>
              <div>
                <div class="mb-1 text-xs text-gray-500">日期2</div>
                <DatePicker v-model:value="date2" class="w-full" />
              </div>
              <div>
                <div class="mb-1 text-xs text-gray-500">日期3</div>
                <DatePicker v-model:value="date3" class="w-full" />
              </div>
              <div class="flex justify-end gap-2">
                <Button size="small" type="text" @click="popoverOpen = false">
                  取消
                </Button>
                <Button size="small" type="primary" @click="confirmDates">
                  确定
                </Button>
              </div>
            </div>
          </template>
          <Button size="small">自选日期</Button>
        </Popover>
      </Space>
    </div>
    <div class="relative h-[326px] w-full">
      <EchartsUI ref="chartRef" height="326px" width="100%" />
      <div
        v-if="!loading && !hasChartData"
        class="absolute inset-0 flex items-center justify-center bg-card px-6 text-center text-sm text-muted-foreground"
      >
        {{ emptyHint }}
      </div>
    </div>
  </div>
</template>
