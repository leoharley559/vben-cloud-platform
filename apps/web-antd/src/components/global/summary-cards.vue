<script lang="ts" setup>
export interface SummaryCardItem {
  label: string;
  /** 需要着色时传入，如输赢正负 */
  valueClass?: string;
  /** 展示文案，金额请先格式化 */
  value: number | string;
}

defineOptions({ name: 'SummaryCards' });

defineProps<{ items: SummaryCardItem[] }>();
</script>

<template>
  <div
    v-if="items.length > 0"
    class="mb-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-5"
  >
    <div v-for="item in items" :key="item.label" class="rounded border p-2">
      {{ item.label }}：
      <span :class="item.valueClass">{{ item.value }}</span>
    </div>
  </div>
</template>
