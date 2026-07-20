<script lang="ts" setup>
import { Card, Space } from 'ant-design-vue';

defineOptions({ name: 'ReportQueryCard' });

defineProps<{
  title?: string;
}>();
</script>

<template>
  <Card class="mb-4" :title="title" size="small">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <Space wrap class="flex-1">
        <slot></slot>
      </Space>
      <Space wrap>
        <slot name="actions"></slot>
      </Space>
    </div>
    <div v-if="$slots.extra" class="mt-3">
      <slot name="extra"></slot>
    </div>
  </Card>
</template>
