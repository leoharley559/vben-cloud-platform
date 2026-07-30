<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Form, Input, Modal, Select, message } from 'ant-design-vue';

import { updatePlayerWithdrawWaterApi } from '#/api/operationManage/player-detail-extra';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';
import { WITHDRAW_WATER_TYPE_OPTIONS } from '#/utils/player-detail-maps';

defineOptions({ name: 'StreamingAddTurnoverModal' });

const props = defineProps<{
  open: boolean;
  playerId: number | string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { ensureGameConfig, gameConfig } = useGameConfig();
const submitting = ref(false);
const amount = ref('');
const waterType = ref(0);
const waterValList = ref<string[]>([]);

const platformTypeOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameType).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  })),
);

const venueOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameList).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  })),
);

const venueValueOptions = computed(() =>
  waterType.value === 1 ? platformTypeOptions.value : venueOptions.value,
);

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    await ensureGameConfig();
    amount.value = '';
    waterType.value = 0;
    waterValList.value = [];
  },
);

watch(waterType, () => {
  waterValList.value = [];
});

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  const factor = Number(amount.value);
  if (!factor || factor <= 0) {
    message.warning('请输入有效的流水金额');
    return;
  }
  if (waterType.value > 0 && waterValList.value.length === 0) {
    message.warning('请选择场馆类型或场馆');
    return;
  }

  submitting.value = true;
  try {
    await updatePlayerWithdrawWaterApi({
      AddType: 1,
      PlayerId: props.playerId,
      WaterType: waterType.value + 1,
      WithdrawWaterFactor: Math.round(factor * 100),
      WaterValList: waterType.value === 0 ? '' : waterValList.value.join(','),
    });
    message.success('增加流水成功');
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    title="增加流水"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="增加流水" required>
        <Input
          v-model:value="amount"
          allow-clear
          placeholder="请输入金额"
          suffix="元"
        />
      </Form.Item>
      <Form.Item label="提款流水场馆" required>
        <Select
          v-model:value="waterType"
          :options="WITHDRAW_WATER_TYPE_OPTIONS"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item
        v-if="waterType > 0"
        :label="waterType === 1 ? '场馆类型' : '场馆'"
        required
      >
        <Select
          v-model:value="waterValList"
          allow-clear
          mode="multiple"
          :max-tag-count="2"
          :options="venueValueOptions"
          placeholder="请选择"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
