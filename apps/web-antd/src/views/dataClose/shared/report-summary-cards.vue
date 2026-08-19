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
  <div
    class="mb-2 flex flex-wrap items-center justify-between gap-2"
  >
    <SummaryCards class="!mb-0 min-w-0 flex-1" :items="cards" />
    <div
      v-if="$slots.extra"
      class="flex shrink-0 items-center gap-2"
    >
      <slot name="extra"></slot>
    </div>
  </div>
</template>
