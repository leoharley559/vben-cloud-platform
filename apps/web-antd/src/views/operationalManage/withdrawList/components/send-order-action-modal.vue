<script lang="ts" setup>
import type { WithdrawFinanceItem } from '#/types/withdraw-extra';

import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Radio } from 'ant-design-vue';

import { refuseWithdrawApi } from '#/api/operationManage/withdraw';
import { updateSendOrderListApi } from '#/api/operationManage/withdraw-extra';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'SendOrderActionModal' });

const props = defineProps<{
  mode: 'hangup' | 'reject';
  open: boolean;
  row: null | WithdrawFinanceItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const riskRemarks = ref('');
const remark = ref('');
const refundScore = ref(1);

const title = computed(() =>
  props.mode === 'hangup' ? '挂起订单' : '拒绝出款',
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    riskRemarks.value = '';
    remark.value = '';
    refundScore.value = 1;
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
    await (props.mode === 'hangup' ? updateSendOrderListApi({
        Id: props.row.Id,
        RiskRemarks: riskRemarks.value,
        RiskStatus: 3,
      }) : refuseWithdrawApi({
        HandlerInf: remark.value,
        Id: props.row.Id,
        RefundScore: refundScore.value,
        Remark: remark.value,
        RiskStatus: 2,
      }));
    message.success('操作成功');
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
    width="520px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <div v-if="row" class="mb-4 text-sm">
      <div>游戏账号：{{ row.LoginAccount || '-' }}</div>
      <div>订单编号：{{ row.OrderId || '-' }}</div>
      <div>提现金额：{{ formatAmountFromCent(row.Amount) }}</div>
    </div>

    <Form layout="vertical">
      <Form.Item v-if="mode === 'hangup'" label="挂起备注" required>
        <Input.TextArea
          v-model:value="riskRemarks"
          :rows="3"
          placeholder="请输入挂起备注"
        />
      </Form.Item>

      <template v-if="mode === 'reject'">
        <Form.Item label="是否退币">
          <Radio.Group v-model:value="refundScore">
            <Radio :value="1">退币</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="拒绝备注">
          <Input.TextArea
            v-model:value="remark"
            :rows="3"
            placeholder="请输入拒绝备注"
          />
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
