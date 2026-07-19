<script lang="ts" setup>
import type { SelfCheckListItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import { Form, Input, Modal } from 'ant-design-vue';

import {
  createSelfCheckActionRecordApi,
  handleSelfCheckOrderApi,
} from '#/api/operationManage/recharge-extra';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'SelfCheckActionModal' });

const props = defineProps<{
  actionType: 1 | 2 | 4;
  open: boolean;
  operatorName: string;
  row: SelfCheckListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const realAmount = ref('');
const validCode = ref('');
const reviewRemark = ref('');
const remark = ref('');

const title = computed(() => {
  if (props.actionType === 1) {
    return '补分';
  }
  if (props.actionType === 2) {
    return '拒绝';
  }
  return '新增处理记录';
});

const amountText = computed(() => formatAmountFromCent(props.row?.Amount));

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    realAmount.value = '';
    validCode.value = '';
    reviewRemark.value = '';
    remark.value = '';
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!props.row) {
    return;
  }

  const base = {
    GameOrderId: props.row.GameOrderId,
    GameOrderIdOrigin: props.row.GameOrderIdOrigin,
    OrderId: props.row.OrderId,
    PlayerId: props.row.PlayerId,
    ReviewName: props.operatorName,
  };

  submitting.value = true;
  try {
    if (props.actionType === 4) {
      await createSelfCheckActionRecordApi({
        ...base,
        Remark: remark.value,
      });
    } else if (props.actionType === 1) {
      await handleSelfCheckOrderApi({
        ...base,
        Action: 'p',
        RealAmount: Number(realAmount.value) * 100,
        ValidCode: validCode.value,
      });
    } else {
      await handleSelfCheckOrderApi({
        ...base,
        Action: 'f',
        ReviewRemark: reviewRemark.value,
      });
    }
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
      <template v-if="actionType !== 4">
        <Form.Item label="查单编号">
          <Input :value="row?.GameOrderId" disabled />
        </Form.Item>
        <Form.Item label="游戏订单编号">
          <Input :value="row?.GameOrderIdOrigin" disabled />
        </Form.Item>
        <Form.Item label="订单编号">
          <Input :value="row?.OrderId" disabled />
        </Form.Item>
        <Form.Item label="充值金额">
          <Input :value="amountText" disabled />
        </Form.Item>
      </template>

      <Form.Item v-if="actionType === 1" label="实际充值金额" required>
        <Input v-model:value="realAmount" placeholder="请输入实际充值金额" />
      </Form.Item>
      <Form.Item v-if="actionType === 1" label="谷歌验证码" required>
        <Input v-model:value="validCode" placeholder="请输入谷歌验证码" />
      </Form.Item>
      <Form.Item v-if="actionType === 2" label="拒绝备注" required>
        <Input.TextArea
          v-model:value="reviewRemark"
          :rows="3"
          placeholder="请输入拒绝备注"
        />
      </Form.Item>
      <Form.Item v-if="actionType === 4" label="处理备注" required>
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          placeholder="请输入处理备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
