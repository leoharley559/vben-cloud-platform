<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { DailyReportRow } from '#/utils/everyday-data-calc';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { RadioButton, RadioGroup } from 'ant-design-vue';

import { CHART_COLORS } from '#/utils/dashboard';

defineOptions({ name: 'DailyReportLineChart' });

const props = withDefaults(
  defineProps<{
    adminType?: number;
    exchangeRate?: number;
    tabList: DailyReportRow[];
    visibleTabs: Partial<Record<ChartMetric, boolean>>;
  }>(),
  {
    adminType: 1,
    exchangeRate: 1,
    visibleTabs: () => ({}),
  },
);

type ChartMetric =
  | 'betMoney'
  | 'betNum'
  | 'pay_withdraw'
  | 'payMoney'
  | 'payNum'
  | 'profit';

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

const activeMetric = ref<ChartMetric>('payMoney');

const availableMetrics = computed(() => {
  const adminType2: ChartMetric[] = ['payMoney', 'payNum', 'pay_withdraw'];
  const adminType1: ChartMetric[] = [
    'betMoney',
    'betNum',
    'profit',
    ...adminType2,
  ];
  const candidates = props.adminType === 1 ? adminType1 : adminType2;
  return candidates.filter((key) => props.visibleTabs[key] !== false);
});

watch(
  availableMetrics,
  (metrics) => {
    if (!metrics.includes(activeMetric.value)) {
      activeMetric.value = metrics[0] || 'payMoney';
    }
  },
  { immediate: true },
);

function toYuan(value: unknown) {
  return Number(((Number(value || 0) * props.exchangeRate) / 100).toFixed(2));
}

function buildSeries(metric: ChartMetric) {
  const xData = props.tabList.map((row) => String(row.ReportDay || ''));
  switch (metric) {
    case 'betMoney': {
      return {
        legend: ['投注金额', '人均投注', '投注人数'],
        selected: { 人均投注: false },
        series: [
          {
            data: props.tabList.map((row) => toYuan(row.SumTransBetMoney1)),
            name: '投注金额',
            type: 'line',
            yAxisIndex: 0,
          },
          {
            data: props.tabList.map((row) => toYuan(row.AverageTransBetMoney)),
            name: '人均投注',
            type: 'line',
            yAxisIndex: 1,
          },
          {
            data: props.tabList.map((row) => Number(row.SumTransBetNum1 || 0)),
            name: '投注人数',
            type: 'line',
            yAxisIndex: 1,
          },
        ],
        xData,
      };
    }
    case 'betNum': {
      return {
        legend: ['注册人数', '登录人数', '投注人数'],
        selected: { 注册人数: false },
        series: [
          {
            data: props.tabList.map((row) => Number(row.SumReg || 0)),
            name: '注册人数',
            type: 'line',
          },
          {
            data: props.tabList.map((row) => Number(row.SumLogin || 0)),
            name: '登录人数',
            type: 'line',
          },
          {
            data: props.tabList.map((row) => Number(row.SumTransBetNum1 || 0)),
            name: '投注人数',
            type: 'line',
          },
        ],
        xData,
      };
    }
    case 'pay_withdraw': {
      return {
        legend: ['充兑差', '充兑比'],
        series: [
          {
            data: props.tabList.map((row) => toYuan(row.DiffPayWithdrawMoney)),
            name: '充兑差',
            type: 'line',
            yAxisIndex: 0,
          },
          {
            data: props.tabList.map((row) =>
              Number(row.PercentPayWithdraw || 0),
            ),
            name: '充兑比',
            type: 'line',
            yAxisIndex: 1,
          },
        ],
        xData,
      };
    }
    case 'payMoney': {
      return {
        legend: ['充值金额', 'ARPPU', '付费人数'],
        selected: { ARPPU: false },
        series: [
          {
            data: props.tabList.map((row) => toYuan(row.SumPayMergerMoney)),
            name: '充值金额',
            type: 'line',
            yAxisIndex: 0,
          },
          {
            data: props.tabList.map(
              (row) => Number(row.Arppu || 0) * props.exchangeRate,
            ),
            name: 'ARPPU',
            type: 'line',
            yAxisIndex: 1,
          },
          {
            data: props.tabList.map((row) => Number(row.SumPayMergerNum || 0)),
            name: '付费人数',
            type: 'line',
            yAxisIndex: 1,
          },
        ],
        xData,
      };
    }
    case 'payNum': {
      return {
        legend: ['注册人数', '登录人数', '付费人数'],
        selected: { 注册人数: false },
        series: [
          {
            data: props.tabList.map((row) => Number(row.SumReg || 0)),
            name: '注册人数',
            type: 'line',
          },
          {
            data: props.tabList.map((row) => Number(row.SumLogin || 0)),
            name: '登录人数',
            type: 'line',
          },
          {
            data: props.tabList.map((row) => Number(row.SumPayMergerNum || 0)),
            name: '付费人数',
            type: 'line',
          },
        ],
        xData,
      };
    }
    case 'profit': {
      return {
        legend: ['盈利', '盈率'],
        series: [
          {
            data: props.tabList.map((row) => toYuan(row.CompanyProfitMoney)),
            name: '盈利',
            type: 'line',
            yAxisIndex: 0,
          },
          {
            data: props.tabList.map((row) => Number(row.PercentProfit || 0)),
            name: '盈率',
            type: 'line',
            yAxisIndex: 1,
          },
        ],
        xData,
      };
    }
    default: {
      return { legend: [], series: [], xData };
    }
  }
}

const metricLabels: Record<ChartMetric, string> = {
  betMoney: '投注金额',
  betNum: '投注人数',
  payMoney: '充值金额',
  payNum: '充值人数',
  pay_withdraw: '充兑差',
  profit: '盈利',
};

async function renderChart() {
  const { legend, selected, series, xData } = buildSeries(activeMetric.value);
  await nextTick();
  await renderEcharts({
    color: CHART_COLORS,
    grid: { bottom: 24, left: 48, right: 48, top: 48 },
    legend: {
      data: legend,
      ...(selected
        ? { selected: selected as unknown as Record<string, boolean> }
        : {}),
      top: 0,
    },
    series: series.map((item, index) => ({
      ...item,
      itemStyle: { color: CHART_COLORS[index % CHART_COLORS.length] },
      smooth: true,
      type: 'line' as const,
    })),
    tooltip: { trigger: 'axis' },
    xAxis: { boundaryGap: false, data: xData, type: 'category' },
    yAxis: [
      { type: 'value' },
      {
        axisLabel: { formatter: String },
        splitLine: { show: false },
        type: 'value',
      },
    ],
  });
  resize();
}

watch(
  () => [props.tabList, props.exchangeRate, activeMetric.value],
  () => void renderChart(),
  { deep: true },
);

onMounted(() => {
  window.setTimeout(() => void renderChart(), 80);
});
</script>

<template>
  <div class="space-y-3">
    <div class="mb-3">
      <RadioGroup
        v-model:value="activeMetric"
        button-style="solid"
        size="small"
      >
        <RadioButton
          v-for="metric in availableMetrics"
          :key="metric"
          :value="metric"
        >
          {{ metricLabels[metric] }}
        </RadioButton>
      </RadioGroup>
    </div>
    <EchartsUI ref="chartRef" height="300px" width="100%" />
  </div>
</template>
