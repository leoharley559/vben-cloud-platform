<script lang="ts" setup>
import { computed } from 'vue';

import { formatComparePercent, toNumber } from '#/utils/dashboard';

defineOptions({ name: 'OnlineCountCard' });

const props = defineProps<{
  loading?: boolean;
  today: Record<string, unknown>;
  yesterday: Record<string, unknown>;
}>();

const todayCount = computed(() => toNumber(props.today.SumOnlinePlayerNum));
const yesterdayCount = computed(() =>
  toNumber(props.yesterday.SumOnlinePlayerNum),
);
const diff = computed(() => todayCount.value - yesterdayCount.value);
const compareText = computed(() => {
  if (!yesterdayCount.value) {
    return `+${todayCount.value}`;
  }
  return formatComparePercent(diff.value, yesterdayCount.value);
});
const positive = computed(() => diff.value >= 0);
</script>

<template>
  <div
    class="flex h-[361px] flex-col justify-between rounded-xl bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm"
  >
    <div class="flex items-center gap-2 text-cyan-500">
      <span class="text-2xl">●</span>
      <span class="text-sm text-gray-500">在线人数</span>
    </div>
    <div>
      <div class="text-4xl font-semibold text-gray-900">
        {{ loading ? '—' : todayCount }}
      </div>
      <div class="mt-3 text-sm text-gray-500">
        较昨日
        <span
          class="ml-1 font-medium"
          :class="positive ? 'text-emerald-600' : 'text-red-500'"
        >
          {{ compareText }}
        </span>
      </div>
    </div>
  </div>
</template>
