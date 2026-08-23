<script lang="ts" setup>
import type { RechargeListItem } from '#/types/operation-manage';

import { reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import {
  fetchRechargeDetailApi,
  replaceRechargeOrderApi,
} from '#/api/operationManage/recharge';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'RechargeReplaceOrderModal' });

const props = defineProps<{
  open: boolean;
  row: null | RechargeListItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const saving = ref(false);
const detail = ref<null | Record<string, unknown>>(null);
const form = reactive({
  Remark: '',
});

watch(
  () => props.open,
  async (open) => {
    if (!open || !props.row?.Id) {
      return;
    }
    form.Remark = String(props.row.Remark || '');
    detail.value = null;
    loading.value = true;
    try {
      detail.value = (await fetchRechargeDetailApi(props.row.Id)) || {
        ...props.row,
      };
      form.Remark = String(detail.value?.Remark || form.Remark || '');
    } finally {
      loading.value = false;
    }
  },
);

function close() {
  emit('update:open', false);
}

async function handleOk() {
  if (!detail.value) {
    return;
  }
  saving.value = true;
  try {
    await replaceRechargeOrderApi({
      ...detail.value,
      Remark: form.Remark.trim(),
    });
    message.success('补单成功');
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
    title="游戏补单"
    @cancel="close"
    @ok="handleOk"
    @update:open="(v) => emit('update:open', v)"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item label="订单编号">
        <Input
          :value="String(detail?.OrderId || row?.OrderId || '-')"
          disabled
        />
      </Form.Item>
      <Form.Item label="玩家 ID">
        <Input
          :value="String(detail?.PlayerId || row?.PlayerId || '-')"
          disabled
        />
      </Form.Item>
      <Form.Item label="实付金额">
        <Input
          :value="formatAmountFromCent((detail?.RealAmount ?? row?.RealAmount) as string | number | null | undefined)"
          disabled
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="form.Remark"
          :rows="3"
          allow-clear
          :disabled="loading"
          placeholder="选填"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
