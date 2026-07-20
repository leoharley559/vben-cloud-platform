<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { TimeshareHourItem } from '#/types/promotion';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Empty, Table } from 'ant-design-vue';

import { antTableScrollY } from '#/utils/table-height';
import {
  buildTimeshareChart,
  buildTimeshareTable,
  TIMESHARE_METRIC_MAP,
  type TimeshareChartType,
  type TimeshareMetricKey,
} from '#/utils/timeshare-data';

const props = defineProps<{
  chartType: TimeshareChartType;
  data: TimeshareHourItem[][];
  metric: TimeshareMetricKey;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const sharedLegendSelected: Record<string, boolean> = {};

const tableData = computed(() => buildTimeshareTable(props.data, props.metric));

const tableColumns = computed(() => {
  const columns: Array<{
    dataIndex: string;
    fixed?: 'left';
    key: string;
    title: string;
    width: number;
  }> = [
    {
      dataIndex: 'hour',
      fixed: 'left',
      key: 'hour',
      title: '时间/日期',
      width: 100,
    },
  ];
  tableData.value.reportDays.forEach((day, index) => {
    columns.push({
      dataIndex: `day_${index}`,
      key: `day_${index}`,
      title: day,
      width: 120,
    });
  });
  return columns;
});

async function renderChart() {
  if (props.chartType === 'table' || props.data.length === 0) {
    return;
  }
  const chart = buildTimeshareChart(props.data, props.metric, props.chartType);
  const selected = Object.fromEntries(
    chart.legend.map((day, index) => [
      day,
      sharedLegendSelected[day] ?? index === 0,
    ]),
  );
  const instance = await renderEcharts({
    grid: {
      bottom: 20,
      containLabel: true,
      left: '2%',
      right: '2%',
      top: 40,
    },
    legend: {
      data: chart.legend,
      selected,
      top: 0,
    },
    series: chart.series,
    title: {
      left: 'center',
      text: TIMESHARE_METRIC_MAP[props.metric].label,
      top: 24,
    },
    tooltip: { axisPointer: { type: 'cross' }, trigger: 'axis' },
    xAxis: {
      data: chart.xAxis,
      type: 'category',
    },
    yAxis: {
      minInterval: 1,
      splitNumber: 4,
      type: 'value',
    },
  });
  instance?.off('legendselectchanged');
  instance?.on(
    'legendselectchanged',
    (event: unknown) => {
      const payload = event as { selected?: Record<string, boolean> };
      Object.assign(sharedLegendSelected, payload.selected || {});
    },
  );
}

watch(
  () => [props.data, props.metric, props.chartType] as const,
  () => {
    renderChart();
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <Empty v-if="data.length === 0" class="py-24" description="暂无时段数据" />
  <div v-else-if="chartType === 'table'" class="overflow-auto">
    <Table
      bordered
      :columns="tableColumns"
      :data-source="tableData.rows"
      :pagination="false"
      :scroll="{ x: 'max-content', y: antTableScrollY(100) }"
      size="small"
    />
  </div>
  <div v-else class="h-[520px] w-full">
    <EchartsUI ref="chartRef" class="h-full w-full" />
  </div>
</template>
