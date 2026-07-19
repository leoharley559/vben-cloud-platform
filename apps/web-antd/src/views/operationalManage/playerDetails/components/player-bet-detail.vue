<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Radio, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PlayerBetDateStats from './player-bet-date-stats.vue';
import PlayerBetRecord from './player-bet-record.vue';
import PlayerBetVenueStats from './player-bet-venue-stats.vue';

defineOptions({ name: 'PlayerBetDetailPanel' });

defineProps<{
  loginAccount?: string;
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canDetailRecord = computed(() => checkPermission(11639));
const canVenueStats = computed(() => checkPermission(10431));
const canDateStats = computed(() => checkPermission(11638));

const activeType = ref<'dateTotal' | 'record' | 'venueTotal'>('record');

function resolveDefaultType() {
  if (canDetailRecord.value) {
    activeType.value = 'record';
  } else if (canVenueStats.value) {
    activeType.value = 'venueTotal';
  } else if (canDateStats.value) {
    activeType.value = 'dateTotal';
  }
}

resolveDefaultType();
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="activeType" button-style="solid">
        <Radio.Button v-if="canDetailRecord" value="record">
          详情记录
        </Radio.Button>
        <Radio.Button v-if="canVenueStats" value="venueTotal">
          场馆统计
        </Radio.Button>
        <Radio.Button v-if="canDateStats" value="dateTotal">
          日期统计
        </Radio.Button>
      </Radio.Group>
    </div>

    <PlayerBetRecord
      v-if="activeType === 'record' && canDetailRecord"
      :login-account="loginAccount"
      :player-id="playerId"
    />
    <PlayerBetVenueStats
      v-else-if="activeType === 'venueTotal' && canVenueStats"
      :login-account="loginAccount"
      :player-id="playerId"
    />
    <PlayerBetDateStats
      v-else-if="activeType === 'dateTotal' && canDateStats"
      :login-account="loginAccount"
      :player-id="playerId"
    />
    <Result
      v-else
      status="403"
      sub-title="需要注单详情子权限（11639 / 10431 / 11638）"
      title="无权限"
    />
  </div>
</template>
