<script lang="ts" setup>
import { ref } from 'vue';

import { getCurrentMonthRangeSeconds } from '#/utils/date-range';

import PlayerCoinPeriodPanel from './player-coin-period.vue';
import PlayerCoinSettlePanel from './player-coin-settle.vue';
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
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PlayerCoinSettlePanel
        class="min-w-0"
        :begin-time="beginTime"
        :end-time="endTime"
        :player-id="playerId"
      />
      <PlayerGoldChangePanel
        class="min-w-0"
        :begin-time="beginTime"
        :end-time="endTime"
        :player-id="playerId"
      />
    </div>
  </div>
</template>
