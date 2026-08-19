<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

defineOptions({ name: 'ReportPieChart' });

const props = withDefaults(
  defineProps<{
    data: Array<{ name: string; value: number }>;
    height?: string;
    title?: string;
  }>(),
  {
    height: '240px',
    title: '',
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts, resize } = useEcharts(chartRef);

async function render() {
  await nextTick();
  renderEcharts({
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [
      {
        data: props.data.map((item) => ({
          name: item.name,
          value: Math.max(0, Number(item.value) || 0),
        })),
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        name: props.title,
        radius: ['0%', '62%'],
        type: 'pie',
      },
    ],
    tooltip: { trigger: 'item' },
  });
  resize();
}

watch(
  () => props.data,
  () => void render(),
  { deep: true },
);

onMounted(() => void render());
</script>

<template>
  <div>
    <div v-if="title" class="mb-2 font-medium">{{ title }}</div>
    <EchartsUI ref="chartRef" :height="height" width="100%" />
  </div>
</template>
