<script lang="ts" setup>
export interface SummaryCardItem {
  /** 卡片整体样式，如未处理订单高亮 */
  cardClass?: string;
  label: string;
  /** 可点击筛选时传入 */
  onClick?: () => void;
  /** 需要着色时传入，如输赢正负 */
  valueClass?: string;
  /** 展示文案，金额请先格式化 */
  value: number | string;
}

defineOptions({ name: 'SummaryCards' });

defineProps<{ items: SummaryCardItem[] }>();
</script>

<template>
  <div v-if="items.length > 0" class="ops-summary-cards mb-2 text-sm">
    <div
      v-for="item in items"
      :key="item.label"
      class="rounded border p-2"
      :class="[
        item.cardClass,
        item.onClick ? 'cursor-pointer hover:border-primary' : '',
      ]"
      @click="item.onClick?.()"
    >
      {{ item.label }}：
      <span :class="item.valueClass">{{ item.value }}</span>
    </div>
  </div>
</template>
