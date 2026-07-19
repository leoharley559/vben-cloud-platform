<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { MapChart } from 'echarts/charts';
import {
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import worldMapJson from '../data/worldMap.json';

defineOptions({ name: 'OnlineWorldMap' });

const props = defineProps<{
  data: Array<{ name: string; value: number }>;
}>();

echarts.use([
  MapChart,
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const chartEl = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;
let mapRegistered = false;

function renderChart() {
  if (!chartEl.value) return;
  if (!mapRegistered) {
    echarts.registerMap('world', worldMapJson as never);
    mapRegistered = true;
  }
  if (!chart) {
    chart = echarts.init(chartEl.value);
  }
  chart.setOption({
    series: [
      {
        bottom: 0,
        data: props.data,
        itemStyle: {
          emphasis: { areaColor: '#eee' },
        },
        left: 0,
        map: 'world',
        right: 0,
        roam: true,
        top: 0,
        type: 'map',
      },
    ],
    tooltip: {
      formatter: (params: { name?: string; value?: number }) =>
        `${params.name || ''} : ${params.value ?? 0}`,
      trigger: 'item',
    },
    visualMap: {
      outOfRange: { color: ['#2556AC'] },
      pieces: [
        { color: '#00AE5B', max: 100, min: 1 },
        { color: '#009984', max: 500, min: 101 },
      ],
      show: false,
      type: 'piecewise',
    },
  });
  chart.resize();
}

watch(
  () => props.data,
  () => renderChart(),
  { deep: true },
);

onMounted(() => {
  window.setTimeout(() => renderChart(), 120);
  window.addEventListener('resize', renderChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <div ref="chartEl" class="h-[300px] w-full" />
</template>
