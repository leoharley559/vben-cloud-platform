<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import {
  formatPlayerStatus,
  playerStatusTagColor,
} from '#/utils/player-status';

defineOptions({ name: 'PlayerStatusTag' });

const props = withDefaults(
  defineProps<{
    /** 状态为「正常」(0) 时是否不渲染（用于账号旁角标） */
    hideNormal?: boolean;
    status?: null | number | string;
  }>(),
  {
    hideNormal: false,
    status: undefined,
  },
);

const text = computed(() => formatPlayerStatus(props.status));
const color = computed(() => playerStatusTagColor(props.status));
const isNormal = computed(() => Number(props.status) === 0);
</script>

<template>
  <template v-if="status === undefined || status === null || status === ''">
    <span>-</span>
  </template>
  <template v-else-if="hideNormal && isNormal"></template>
  <span v-else-if="isNormal || !color">{{ text }}</span>
  <Tag v-else :color="color">{{ text }}</Tag>
</template>
