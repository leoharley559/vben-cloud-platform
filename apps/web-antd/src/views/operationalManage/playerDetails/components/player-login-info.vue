<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import PlayerLoginHistory from './player-login-history.vue';
import PlayerLoginStatistics from './player-login-statistics.vue';

defineOptions({ name: 'PlayerLoginInfoPanel' });

defineProps<{
  playerId: number | string;
}>();

const activeType = ref<'record' | 'statistics'>('record');
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-4">
      <Radio.Group v-model:value="activeType" button-style="solid">
        <Radio.Button value="record">登录记录</Radio.Button>
        <Radio.Button value="statistics">登录统计</Radio.Button>
      </Radio.Group>
    </div>

    <PlayerLoginHistory v-if="activeType === 'record'" :player-id="playerId" />
    <PlayerLoginStatistics v-else :player-id="playerId" />
  </div>
</template>
