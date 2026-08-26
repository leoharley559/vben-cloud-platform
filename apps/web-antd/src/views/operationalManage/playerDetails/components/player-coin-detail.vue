<script lang="ts" setup>
import { ref } from 'vue';

import { getCurrentMonthRangeSeconds } from '#/utils/date-range';

import PlayerCoinPeriodPanel from './player-coin-period.vue';
import PlayerGoldChangePanel from './player-gold-change.vue';

defineOptions({ name: 'PlayerCoinDetailPanel' });

defineProps<{
  playerId: number | string;
}>();

const defaultRange = getCurrentMonthRangeSeconds();
const beginTime = ref(defaultRange.BeginTime);
const endTime = ref(defaultRange.EndTime);

function handleDateChange(begin: number, end: number) {
  beginTime.value = begin;
  endTime.value = end;
}
</script>

<template>
  <div class="space-y-4">
    <PlayerCoinPeriodPanel
      :player-id="playerId"
      @date-change="handleDateChange"
    />
    <PlayerGoldChangePanel
      :begin-time="beginTime"
      :end-time="endTime"
      :player-id="playerId"
    />
  </div>
</template>
