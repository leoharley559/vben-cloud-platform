<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { CHART_COLORS } from '#/utils/dashboard';

defineOptions({ name: 'OnlinePieChart' });

const props = defineProps<{
  data: Array<{ name: string; value: number }>;
  height?: string;
  title: string;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

async function renderChart() {
  await nextTick();
  await renderEcharts({
    color: CHART_COLORS,
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [
      {
        data: props.data,
        emphasis: {
          label: { fontSize: 12, fontWeight: 'bold', show: true },
        },
        label: { show: false },
        labelLine: { show: false },
        radius: '62%',
        type: 'pie',
      },
    ],
    title: {
      left: 'center',
      text: props.title,
      textStyle: { color: '#1890ff', fontSize: 15, fontWeight: 500 },
      top: 8,
    },
    tooltip: { trigger: 'item' },
  });
  resize();
}

watch(
  () => props.data,
  () => void renderChart(),
  { deep: true },
);

onMounted(() => {
  window.setTimeout(() => void renderChart(), 80);
});
</script>

<template>
  <div class="h-full w-full">
    <EchartsUI ref="chartRef" :height="height || '320px'" width="100%" />
  </div>
</template>
