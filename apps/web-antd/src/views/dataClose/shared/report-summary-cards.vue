<script lang="ts" setup>
import { computed } from 'vue';

import SummaryCards from '#/components/global/summary-cards.vue';

export interface ReportSummaryItem {
  title: string;
  value: number | string;
}

defineOptions({ name: 'ReportSummaryCards' });

const props = defineProps<{
  items: ReportSummaryItem[];
}>();

const cards = computed(() =>
  props.items.map((item) => ({ label: item.title, value: item.value })),
);
</script>

<template>
  <SummaryCards :items="cards" />
</template>
