<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { RadioButton, RadioGroup } from 'ant-design-vue';

export interface ReportChartMetric {
  key: string;
  label: string;
}

export interface ReportChartSeries {
  data: number[];
  name: string;
  type?: 'bar' | 'line';
  yAxisIndex?: number;
}

defineOptions({ name: 'ReportLineChart' });

const props = withDefaults(
  defineProps<{
    categories: string[];
    height?: string;
    metrics?: ReportChartMetric[];
    series: ReportChartSeries[];
    title?: string;
  }>(),
  {
    height: '360px',
    metrics: () => [],
  },
);

const emit = defineEmits<{
  'update:metric': [key: string];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);
const activeMetric = ref(props.metrics[0]?.key || '');

async function render() {
  await nextTick();
  const hasRightAxis = props.series.some((item) => (item.yAxisIndex || 0) > 0);
  const isBar = props.series.some((item) => (item.type || 'line') === 'bar');
  renderEcharts({
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: hasRightAxis ? 8 : 12,
      top: 36,
    },
    legend: {
      data: props.series.map((item) => item.name),
      top: 0,
    },
    series: props.series.map((item) => ({
      data: item.data,
      name: item.name,
      smooth: true,
      type: item.type || 'line',
      yAxisIndex: item.yAxisIndex || 0,
    })),
    tooltip: { trigger: 'axis' },
    xAxis: {
      boundaryGap: isBar,
      data: props.categories,
      type: 'category',
    },
    yAxis: hasRightAxis
      ? [{ type: 'value' }, { type: 'value' }]
      : [{ type: 'value' }],
  });
  resize();
}

watch(
  () => [props.categories, props.series, activeMetric.value],
  () => void render(),
  { deep: true },
);

watch(
  () => props.metrics,
  (metrics) => {
    if (metrics.length > 0 && !metrics.some((item) => item.key === activeMetric.value)) {
      activeMetric.value = metrics[0]!.key;
      emit('update:metric', activeMetric.value);
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => void render());
</script>

<template>
  <div>
    <div
      v-if="title || metrics.length > 0"
      class="mb-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="font-medium">{{ title }}</div>
      <RadioGroup
        v-if="metrics.length > 0"
        v-model:value="activeMetric"
        button-style="solid"
        size="small"
        @change="emit('update:metric', activeMetric)"
      >
        <RadioButton v-for="item in metrics" :key="item.key" :value="item.key">
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
    </div>
    <EchartsUI ref="chartRef" :height="height" width="100%" />
  </div>
</template>
