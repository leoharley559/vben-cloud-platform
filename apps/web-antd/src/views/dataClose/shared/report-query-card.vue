<script lang="ts" setup>
/**
 * 报表查询条：仅负责筛选区布局，不再自带 Card。
 * 外层由页面 Page > Card（或 Tabs 内 Panel）承接，对齐游戏记录。
 */
defineOptions({ name: 'ReportQueryCard' });

defineProps<{
  /** @deprecated 布局已去掉独立卡片标题，保留 prop 避免调用方报错 */
  title?: string;
}>();
</script>

<template>
  <div class="mb-2">
    <div class="flex flex-wrap items-end gap-x-3 gap-y-2">
      <slot></slot>
      <slot name="actions"></slot>
    </div>
    <div v-if="$slots.extra" class="mt-3">
      <slot name="extra"></slot>
    </div>
  </div>
</template>
