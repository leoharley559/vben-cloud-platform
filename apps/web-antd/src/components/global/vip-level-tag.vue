<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import { formatVipLevelLabel } from '#/utils/vip-level';

defineOptions({ name: 'VipLevelTag' });

const props = withDefaults(
  defineProps<{
    level?: unknown;
  }>(),
  {
    level: undefined,
  },
);

const label = computed(() => formatVipLevelLabel(props.level));
const isEmpty = computed(() => label.value === '-');
</script>

<template>
  <span v-if="isEmpty">-</span>
  <Tag v-else color="gold">{{ label }}</Tag>
</template>
