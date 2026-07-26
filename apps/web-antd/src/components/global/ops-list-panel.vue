<script lang="ts" setup>
/**
 * 查询 + 列表布局：上筛选 / 中汇总 / 下表格。
 * 不再自带卡片壳，由页面外层 Card（或 Page 下直接包 Card）承接。
 */
defineOptions({ name: 'OpsListPanel' });
</script>

<template>
  <div class="ops-list-panel">
    <div
      v-if="$slots.filters"
      class="mb-2 flex flex-wrap items-end gap-x-3 gap-y-2"
    >
      <slot name="filters" />
    </div>
    <div v-if="$slots.summary">
      <slot name="summary" />
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
