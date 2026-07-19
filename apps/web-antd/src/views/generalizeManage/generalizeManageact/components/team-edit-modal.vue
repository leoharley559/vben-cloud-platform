<script lang="ts" setup>
import type { PromoterListItem } from '#/types/promotion';

import { ref, watch } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { updatePromoterTeamApi } from '#/api/promotion/manage';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row?: PromoterListItem;
}>();

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const commissionRate = ref<number>();
const profitCommissionRate = ref<number>();
const childMinRate = ref<number>();
const childMaxRate = ref<number>();
const payPeriod = ref<number>();

watch(
  () => props.row,
  (row) => {
    commissionRate.value = row?.CommissionRate
      ? Number(row.CommissionRate) / 10
      : undefined;
    profitCommissionRate.value = row?.ProfitCommissionRate
      ? Number(row.ProfitCommissionRate) / 10
      : undefined;
    childMinRate.value = row?.ChildMinCommissionRate
      ? Number(row.ChildMinCommissionRate) / 10
      : undefined;
    childMaxRate.value = row?.ChildMaxCommissionRate
      ? Number(row.ChildMaxCommissionRate) / 10
      : undefined;
    payPeriod.value = row?.PayPeriod ? Number(row.PayPeriod) : undefined;
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.row?.Id) {
    return;
  }
  loading.value = true;
  try {
    await updatePromoterTeamApi({
      AccountId: props.row.Id,
      ChildMaxCommissionRate: Math.round(Number(childMaxRate.value || 0) * 10),
      ChildMinCommissionRate: Math.round(Number(childMinRate.value || 0) * 10),
      CommissionRate: Math.round(Number(commissionRate.value || 0) * 10),
      PayPeriod: payPeriod.value,
      ProfitCommissionRate: Math.round(
        Number(profitCommissionRate.value || 0) * 10,
      ),
      TeamType: props.row.TeamType,
    });
    message.success('团队推广信息已更新');
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
    :title="`编辑团队推广：${row?.Username || ''}`"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="佣金分成 (%)">
        <InputNumber
          v-model:value="commissionRate"
          :max="100"
          :min="0"
          :precision="1"
          class="w-full"
        />
      </Form.Item>
      <Form.Item v-if="row?.TeamType === 2" label="利润分成 (%)">
        <InputNumber
          v-model:value="profitCommissionRate"
          :max="100"
          :min="0"
          :precision="1"
          class="w-full"
        />
      </Form.Item>
      <Form.Item label="下级分成区间 (%)">
        <div class="flex items-center gap-2">
          <InputNumber
            v-model:value="childMinRate"
            :max="100"
            :min="0"
            :precision="1"
            class="w-full"
          />
          <span>-</span>
          <InputNumber
            v-model:value="childMaxRate"
            :max="100"
            :min="0"
            :precision="1"
            class="w-full"
          />
        </div>
      </Form.Item>
      <Form.Item label="结算周期 (天)">
        <InputNumber v-model:value="payPeriod" :min="1" class="w-full" />
      </Form.Item>
    </Form>
  </Modal>
</template>
