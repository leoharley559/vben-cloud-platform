<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { TimeshareHourItem } from '#/types/promotion';
import type { TimeshareChartType, TimeshareMetricKey } from '#/utils/timeshare-data';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Empty, Table } from 'ant-design-vue';

import { buildTimeshareChart, buildTimeshareTable, TIMESHARE_METRIC_MAP, timeshareLegendSelected } from '#/utils/timeshare-data';

const props = defineProps<{
  chartType: TimeshareChartType;
  data: TimeshareHourItem[][];
  metric: TimeshareMetricKey;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

const tableData = computed(() => buildTimeshareTable(props.data, props.metric));

const tableColumns = computed(() => {
  const columns: Array<{
    align: 'center';
    dataIndex: string;
    fixed?: 'left';
    key: string;
    title: string;
    width: number;
  }> = [
    {
      align: 'center',
      dataIndex: 'hour',
      fixed: 'left',
      key: 'hour',
      title: '时间/日期',
      width: 100,
    },
  ];
  tableData.value.reportDays.forEach((day, index) => {
    columns.push({
      align: 'center',
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
  await nextTick();
  const chart = buildTimeshareChart(props.data, props.metric, props.chartType);
  const selected = Object.fromEntries(
    chart.legend.map((day, index) => [
      day,
      timeshareLegendSelected[day] ?? index === 0,
    ]),
  );
  const instance = await renderEcharts({
    grid: {
      bottom: 15,
      containLabel: true,
      left: 15,
      right: 15,
      top: 40,
    },
    legend: {
      data: chart.legend,
      icon: 'roundRect',
      itemGap: 14,
      itemHeight: 14,
      itemWidth: 24,
      selected,
      top: 0,
    },
    series: chart.series,
    title: {
      left: 20,
      text: TIMESHARE_METRIC_MAP[props.metric].label,
      textStyle: {
        color: '#36a3f7',
        fontSize: 18,
        fontWeight: 400,
      },
      top: 0,
    },
    tooltip: {
      axisPointer: { type: 'cross' },
      padding: [5, 10],
      trigger: 'axis',
    },
    xAxis: {
      axisTick: { show: true },
      data: chart.xAxis,
      type: 'category',
    },
    yAxis: {
      axisTick: { show: true },
      minInterval: 1,
      type: 'value',
    },
  });
  instance?.off('legendselectchanged');
  instance?.on('legendselectchanged', (event: unknown) => {
    const payload = event as { selected?: Record<string, boolean> };
    Object.assign(timeshareLegendSelected, payload.selected || {});
  });
  resize();
}

watch(
  () => [props.data, props.metric, props.chartType] as const,
  () => {
    void renderChart();
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <Empty v-if="data.length === 0" class="py-24" description="暂无时段数据" />
  <div
    v-else-if="chartType === 'table'"
    class="timeshare-board overflow-hidden"
  >
    <Table
      bordered
      :columns="tableColumns"
      :data-source="tableData.rows"
      :pagination="false"
      :scroll="{ x: 'max-content', y: 'calc(100vh - 340px)' }"
      size="small"
      :row-key="(row) => String(row.hour)"
    />
  </div>
  <div v-else class="timeshare-board w-full">
    <EchartsUI ref="chartRef" height="100%" width="100%" />
  </div>
</template>

<style scoped>
.timeshare-board {
  width: 100%;
  height: calc(100vh - 280px);
  min-height: 420px;
}
</style>
