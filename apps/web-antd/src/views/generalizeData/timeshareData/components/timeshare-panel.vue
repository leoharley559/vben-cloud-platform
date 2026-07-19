<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { TimeshareHourItem } from '#/types/promotion';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Table } from 'ant-design-vue';

import {
  buildTimeshareChart,
  buildTimeshareTable,
  type TimeshareChartType,
  type TimeshareMetricKey,
} from '#/utils/timeshare-data';
import { antTableScrollY } from '#/utils/table-height';

const props = defineProps<{
  chartType: TimeshareChartType;
  data: TimeshareHourItem[][];
  metric: TimeshareMetricKey;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

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

function renderChart() {
  if (props.chartType === 'table' || !props.data.length) {
    return;
  }
  const chart = buildTimeshareChart(props.data, props.metric, props.chartType);
  renderEcharts({
    grid: {
      bottom: 20,
      containLabel: true,
      left: '2%',
      right: '2%',
      top: 40,
    },
    legend: {
      data: chart.legend,
      top: 0,
    },
    series: chart.series,
    tooltip: { trigger: 'axis' },
    xAxis: {
      data: chart.xAxis,
      type: 'category',
    },
    yAxis: {
      splitNumber: 4,
      type: 'value',
    },
  });
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
  <div v-if="chartType === 'table'" class="overflow-auto">
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
