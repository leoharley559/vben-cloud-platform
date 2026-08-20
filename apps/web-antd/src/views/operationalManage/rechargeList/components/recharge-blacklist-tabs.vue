<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BlacklistDevice from './blacklist-device.vue';
import BlacklistGameAccount from './blacklist-game-account.vue';

defineOptions({ name: 'RechargeBlacklistTabs' });

const { checkPermission } = useCloudPermission();

const canGameAccount = computed(() => checkPermission(10_283));
const canDevice = computed(() => checkPermission(10_284));

const activeType = ref<'device' | 'game'>('game');

onMounted(() => {
  if (canGameAccount.value) {
    activeType.value = 'game';
  } else if (canDevice.value) {
    activeType.value = 'device';
  }
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="activeType" button-style="solid">
        <Radio.Button v-if="canGameAccount" value="game">游戏账号</Radio.Button>
        <Radio.Button v-if="canDevice" value="device">设备号</Radio.Button>
      </Radio.Group>
    </div>

    <BlacklistGameAccount v-if="activeType === 'game' && canGameAccount" />
    <BlacklistDevice v-else-if="activeType === 'device' && canDevice" />
  </div>
</template>
