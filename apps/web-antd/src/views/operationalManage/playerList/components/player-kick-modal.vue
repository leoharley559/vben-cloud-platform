<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { updatePlayerExtApi } from '#/api/operationManage/player';

defineOptions({ name: 'PlayerKickModal' });

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{
  lastBlockTime?: number;
  playerId?: number | string | null;
}>();
const emit = defineEmits<{ success: [] }>();

const minutes = ref(0);
const submitting = ref(false);

watch(open, (visible) => {
  if (visible) {
    const val = Number(props.lastBlockTime || 0);
    minutes.value = Math.min(60, Math.max(0, val));
  }
});

async function handleOk() {
  if (!props.playerId) {
    return;
  }
  const clamped = Math.min(60, Math.max(0, Number(minutes.value || 0)));
  minutes.value = clamped;
  submitting.value = true;
  try {
    const now = Math.floor(Date.now() / 1000);
    await updatePlayerExtApi({
      BlockTime: clamped * 60 + now,
      LastBlockTime: clamped,
      PlayerId: props.playerId,
      Status: 6,
    });
    message.success('操作成功');
    open.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="踢下线设置"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item label="踢下线时长（分钟，0-60）" required>
        <InputNumber
          v-model:value="minutes"
          :min="0"
          :max="60"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
