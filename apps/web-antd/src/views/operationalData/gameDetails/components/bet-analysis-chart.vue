<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { formatAmountFromCent } from '#/utils/format-amount';

export type BetMetric =
  | 'betCount'
  | 'betMoney'
  | 'betNum'
  | 'profit'
  | 'profitRatio'
  | 'validBet';

export interface BetAnalysisRow {
  BetCount?: number;
  BetGold?: number;
  BetNumberOfPeople?: number;
  BetType?: number;
  Profit?: number | string;
  ProfitRatio?: number | string;
  ReportDay?: string;
  ValidWater?: number;
  WinGold?: number;
  [key: string]: unknown;
}

defineOptions({ name: 'BetAnalysisChart' });

const props = withDefaults(
  defineProps<{
    height?: string;
    metric: BetMetric;
    rows: BetAnalysisRow[];
  }>(),
  {
    height: '380px',
  },
);

const BET_TYPES = [
  { color: 'rgba(227, 83, 196, 0.8)', key: 1, name: '首页' },
  { color: 'rgba(110, 105, 223, 0.8)', key: 2, name: '详情单' },
  { color: 'rgba(235, 209, 78, 0.8)', key: 3, name: '直播页' },
  { color: 'rgba(29, 196, 48, 0.8)', key: 4, name: '推单' },
  { color: 'rgba(64, 158, 255, 0.8)', key: 0, name: '投注记录' },
] as const;

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

function toYuan(value: unknown) {
  return Number(formatAmountFromCent(Number(value || 0)).replaceAll(',', ''));
}

function buildOption() {
  const categories = [
    ...new Set(props.rows.map((row) => String(row.ReportDay || ''))),
  ].toSorted((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const byType = new Map<number, Map<string, BetAnalysisRow>>();
  for (const type of BET_TYPES) {
    byType.set(type.key, new Map());
  }
  for (const row of props.rows) {
    const type = Number(row.BetType);
    const day = String(row.ReportDay || '');
    const bucket = byType.get(type);
    if (bucket) bucket.set(day, row);
  }

  const lineOnly = props.metric === 'betNum' || props.metric === 'profitRatio';
  const series: Record<string, unknown>[] = [];

  for (const type of BET_TYPES) {
    const map = byType.get(type.key)!;
    if (!lineOnly) {
      series.push({
        data: categories.map((day) => {
          const row = map.get(day);
          if (!row) return 0;
          // 对齐旧站：投注额柱=人数；盈利柱=投注额；次数/有效投注柱=次数
          if (props.metric === 'betMoney') {
            return Number(row.BetNumberOfPeople || 0);
          }
          if (props.metric === 'profit') return toYuan(row.BetGold);
          if (props.metric === 'betCount' || props.metric === 'validBet') {
            return Number(row.BetCount || 0);
          }
          return 0;
        }),
        emphasis: { focus: 'series' },
        itemStyle: { color: type.color },
        name: type.name,
        stack: 'total',
        type: 'bar',
        yAxisIndex: 0,
      });
    }

    series.push({
      data: categories.map((day) => {
        const row = map.get(day);
        if (!row) return 0;
        switch (props.metric) {
          case 'betCount': {
            // 旧站次数 Tab 折线为派送金币
            return toYuan(row.WinGold);
          }
          case 'betMoney': {
            return toYuan(row.BetGold);
          }
          case 'betNum': {
            return Number(row.BetNumberOfPeople || 0);
          }
          case 'profit': {
            return toYuan(Number(row.BetGold || 0) - Number(row.WinGold || 0));
          }
          case 'profitRatio': {
            return Number(row.ProfitRatio || 0);
          }
          case 'validBet': {
            return toYuan(row.ValidWater);
          }
          default: {
            return 0;
          }
        }
      }),
      itemStyle: { color: type.color.replace('0.8', '1') },
      name: type.name,
      smooth: false,
      type: 'line',
      yAxisIndex: lineOnly ? 0 : 1,
    });
  }

  return {
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: lineOnly ? 12 : 8,
      top: 36,
    },
    legend: {
      data: BET_TYPES.map((item) => item.name),
      top: 0,
    },
    series,
    tooltip: { trigger: 'axis' },
    xAxis: {
      boundaryGap: !lineOnly,
      data: categories,
      type: 'category',
    },
    yAxis: lineOnly
      ? [{ type: 'value' }]
      : [{ type: 'value' }, { type: 'value' }],
  };
}

async function render() {
  await nextTick();
  renderEcharts(buildOption());
  resize();
}

watch(
  () => [props.rows, props.metric],
  () => void render(),
  { deep: true },
);

onMounted(() => void render());
</script>

<template>
  <EchartsUI ref="chartRef" :height="height" width="100%" />
</template>
