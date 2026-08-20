<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PlayerCreditRecord from './player-credit-record.vue';
import PlayerEasyRechargeRecord from './player-easy-recharge-record.vue';
import PlayerRechargeRecord from './player-recharge-record.vue';
import PlayerWithdrawRecord from './player-withdraw-record.vue';

defineOptions({ name: 'PlayerRechargeWithdrawPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canCreditRecord = computed(() => checkPermission(11_827));
const canEasyRecharge = computed(() => checkPermission(12_104));

const activeType = ref<'credit' | 'easyrecharge' | 'recharge' | 'withdraw'>(
  'recharge',
);
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="activeType" button-style="solid">
        <Radio.Button value="recharge">充值记录</Radio.Button>
        <Radio.Button value="withdraw">兑换记录</Radio.Button>
        <Radio.Button v-if="canCreditRecord" value="credit">
          代存记录
        </Radio.Button>
        <Radio.Button v-if="canEasyRecharge" value="easyrecharge">
          快捷充值
        </Radio.Button>
      </Radio.Group>
    </div>

    <PlayerRechargeRecord
      v-if="activeType === 'recharge'"
      :player-id="playerId"
    />
    <PlayerWithdrawRecord
      v-else-if="activeType === 'withdraw'"
      :player-id="playerId"
    />
    <PlayerCreditRecord
      v-else-if="activeType === 'credit'"
      :player-id="playerId"
    />
    <PlayerEasyRechargeRecord
      v-else-if="activeType === 'easyrecharge'"
      :player-id="playerId"
    />
  </div>
</template>
