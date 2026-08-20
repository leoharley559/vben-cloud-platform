<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Form, Input, InputNumber, message, Modal } from 'ant-design-vue';

import { createRechargeBlankOrderApi } from '#/api/operationManage/recharge';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'RechargeBlankOrderModal' });

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const saving = ref(false);
const form = reactive({
  Amount: undefined as number | undefined,
  OrderId: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.OrderId = '';
    form.Amount = undefined;
  },
);

function close() {
  emit('update:open', false);
}

async function handleOk() {
  if (!form.OrderId.trim()) {
    message.warning('请输入订单编号');
    return;
  }
  if (!form.Amount || form.Amount <= 0) {
    message.warning('请输入正确金额');
    return;
  }
  saving.value = true;
  try {
    await createRechargeBlankOrderApi({
      Amount: Math.round(form.Amount * 100),
      Hash: createRequestHash(),
      OrderId: form.OrderId.trim(),
    });
    message.success('补空单已提交');
    close();
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    destroy-on-close
    :open="open"
    title="补空单"
    @cancel="close"
    @ok="handleOk"
    @update:open="(v) => emit('update:open', v)"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item label="订单编号" required>
        <Input
          v-model:value="form.OrderId"
          allow-clear
          placeholder="请输入三方/通道订单号"
        />
      </Form.Item>
      <Form.Item label="金额（元）" required>
        <InputNumber
          v-model:value="form.Amount"
          :min="0.01"
          :precision="2"
          class="!w-full"
          placeholder="请输入金额"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
