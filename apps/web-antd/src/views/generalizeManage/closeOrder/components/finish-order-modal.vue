<script lang="ts" setup>
import type { CloseOrderItem } from '#/types/promotion';

import { ref } from 'vue';

import { Button, Form, Input, Modal, message } from 'ant-design-vue';

import { finishCloseOrderApi } from '#/api/promotion/close-order';

const props = defineProps<{
  currentAdminId?: number | string;
  open: boolean;
  row?: CloseOrderItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const saving = ref(false);
const formDesc = ref('');

function handleClose() {
  emit('update:open', false);
  formDesc.value = '';
}

async function handleSubmit(isAccept: number) {
  if (!props.row?.Id) {
    return;
  }
  if (!formDesc.value.trim()) {
    message.warning('请填写备注');
    return;
  }
  saving.value = true;
  try {
    await finishCloseOrderApi({
      Desc: formDesc.value,
      Id: props.row.Id,
      IsAccept: isAccept,
      IsYourSure:
        String(props.row.UpdateAdminId) !== String(props.currentAdminId),
    });
    message.success('处理成功');
    emit('success');
    handleClose();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal :footer="null" :open="open" title="结束订单" @cancel="handleClose">
    <Form layout="vertical">
      <Form.Item label="订单编号">
        <Input :value="row?.OrderId" disabled />
      </Form.Item>
      <Form.Item label="申请金额">
        <Input :value="String(row?.Money ?? '')" disabled />
      </Form.Item>
      <Form.Item label="打款备注" required>
        <Input.TextArea v-model:value="formDesc" :rows="4" />
      </Form.Item>
    </Form>
    <div class="mt-4 flex justify-end gap-2">
      <Button @click="handleClose">取消</Button>
      <Button :loading="saving" danger @click="handleSubmit(0)">拒绝</Button>
      <Button :loading="saving" type="primary" @click="handleSubmit(1)">
        同意打款
      </Button>
    </div>
  </Modal>
</template>
