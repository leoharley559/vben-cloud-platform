<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import { updatePlayerExtApi } from '#/api/operationManage/player';

defineOptions({ name: 'PlayerBanModal' });

const props = defineProps<{
  playerId?: null | number | string;
  playerName?: string;
}>();
const emit = defineEmits<{ success: [] }>();
const open = defineModel<boolean>('open', { default: false });
const remark = ref('');
const submitting = ref(false);

watch(open, (visible) => {
  if (visible) {
    remark.value = '';
  }
});

async function handleOk() {
  if (!props.playerId) {
    return false;
  }
  if (!remark.value.trim()) {
    message.warning('封号必须填写原因');
    return false;
  }
  submitting.value = true;
  try {
    await updatePlayerExtApi({
      PlayerId: props.playerId,
      Remark: remark.value.trim(),
      Status: 3,
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
    title="封号原因"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="handleOk"
  >
    <Form layout="vertical" class="pt-2">
      <p v-if="playerName" class="mb-3">
        确认封号玩家「{{ playerName }}」？
      </p>
      <Form.Item label="原因" required>
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          allow-clear
          placeholder="请填写封号原因"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
