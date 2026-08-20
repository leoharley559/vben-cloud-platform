<script lang="ts" setup>
import type { PlayerEasyRechargeItem } from '#/types/player-detail';

import { computed, ref, watch } from 'vue';

import { Form, Input, Modal } from 'ant-design-vue';

import {
  confirmUsdtRechargeApi,
  reviewUsdtRechargeApi,
} from '#/api/operationManage/easy-recharge';

defineOptions({ name: 'UsdtRechargeActionModal' });

const props = defineProps<{
  mode: 'confirm' | 'review';
  open: boolean;
  row: null | PlayerEasyRechargeItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const amount = ref('');
const confirmAmount = ref('');

const title = computed(() =>
  props.mode === 'confirm' ? 'USDT充值审核' : 'USDT复议充值',
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    amount.value = '';
    confirmAmount.value = '';
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!props.row?.Id) {
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      Amount: amount.value,
      ConfirmAmount: confirmAmount.value,
      Id: props.row.Id,
    };
    await (props.mode === 'confirm' ? confirmUsdtRechargeApi(payload) : reviewUsdtRechargeApi(payload));
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
    :title="title"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="充值金额" required>
        <Input v-model:value="amount" placeholder="请输入充值金额" />
      </Form.Item>
      <Form.Item label="确认金额" required>
        <Input v-model:value="confirmAmount" placeholder="请再次输入确认金额" />
      </Form.Item>
    </Form>
  </Modal>
</template>
