<script lang="ts" setup>
import { ref } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { createPromoterCostOddApi } from '#/api/promotion/manage';
import { useProjectConfig } from '#/composables/use-project-config';

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  success: [];
}>();

const { projectConfig } = useProjectConfig();
const loading = ref(false);
const paymentOdd = ref<number>();
const withdrawOdd = ref<number>();

function initForm() {
  const costOdd = projectConfig.value?.AgentCostOdd as
    | {
        CostOfPaymentOdd?: number;
        CostOfWithdrawOdd?: number;
      }
    | undefined;
  paymentOdd.value = costOdd?.CostOfPaymentOdd
    ? Number(costOdd.CostOfPaymentOdd) / 100
    : undefined;
  withdrawOdd.value = costOdd?.CostOfWithdrawOdd
    ? Number(costOdd.CostOfWithdrawOdd) / 100
    : undefined;
}

async function handleSubmit() {
  if (paymentOdd.value === undefined || withdrawOdd.value === undefined) {
    message.warning('请填写分摊成本');
    return;
  }
  loading.value = true;
  try {
    await createPromoterCostOddApi({
      CostOfPaymentOdd: Math.round(Number(paymentOdd.value) * 100),
      CostOfWithdrawOdd: Math.round(Number(withdrawOdd.value) * 100),
    });
    message.success('分摊成本设置成功');
    open.value = false;
    emit('success');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    title="分摊成本设置"
    @ok="handleSubmit"
    @open="initForm"
  >
    <Form layout="vertical">
      <Form.Item label="充值成本分摊 (%)" required>
        <InputNumber
          v-model:value="paymentOdd"
          :max="100"
          :min="0"
          :precision="2"
          class="w-full"
        />
      </Form.Item>
      <Form.Item label="提现成本分摊 (%)" required>
        <InputNumber
          v-model:value="withdrawOdd"
          :max="100"
          :min="0"
          :precision="2"
          class="w-full"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
