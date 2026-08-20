<script lang="ts" setup>
import type { CloseOrderItem } from '#/types/promotion';

import { ref, watch } from 'vue';

import { Button, Form, Input, message, Modal } from 'ant-design-vue';
import BigNumber from 'bignumber.js';

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

watch(
  () => props.open,
  (open) => {
    if (open) formDesc.value = props.row?.Desc || '';
  },
);

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
  if (formDesc.value.length > 400 || /[\r\n]/.test(formDesc.value)) {
    message.warning('备注须为 1 至 400 个字符，且不能换行');
    return;
  }
  saving.value = true;
  try {
    // 对齐旧站：UpdateAdminId != adminInfo.Admin.Id
    await finishCloseOrderApi({
      Desc: formDesc.value,
      Id: props.row.Id,
      IsAccept: isAccept,
      IsYourSure: props.row.UpdateAdminId != props.currentAdminId,
    });
    message.success('处理成功');
    emit('success');
    handleClose();
  } catch {
    // requestClient 已提示业务错误（如 10403）
  } finally {
    saving.value = false;
  }
}

async function copyValue(value: unknown) {
  try {
    await navigator.clipboard.writeText(String(value ?? ''));
    message.success('复制成功');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function netMoney() {
  const value = new BigNumber(props.row?.Money || 0).minus(
    props.row?.ServiceCharge || 0,
  );
  return value.isNaN() ? '' : value.toFixed(2);
}

function accountTypeName() {
  if (props.row?.BankType === 1) return '银行卡';
  if (props.row?.BankType === 2) return '支付宝';
  return '-';
}
</script>

<template>
  <Modal :footer="null" :open="open" title="打款操作" @cancel="handleClose">
    <Form layout="vertical">
      <Form.Item label="账号类型">
        <Input :value="accountTypeName()" disabled />
      </Form.Item>
      <Form.Item label="姓名">
        <Input :value="row?.BankRealName" disabled>
          <template #addonAfter>
            <Button
              size="small"
              type="link"
              @click="copyValue(row?.BankRealName)"
            >
              复制
            </Button>
          </template>
        </Input>
      </Form.Item>
      <Form.Item label="账号">
        <Input :value="row?.BankAccount" disabled>
          <template #addonAfter>
            <Button
              size="small"
              type="link"
              @click="copyValue(row?.BankAccount)"
            >
              复制
            </Button>
          </template>
        </Input>
      </Form.Item>
      <Form.Item label="打款金额">
        <Input :value="netMoney()" disabled>
          <template #addonAfter>
            <Button size="small" type="link" @click="copyValue(netMoney())">
              复制
            </Button>
          </template>
        </Input>
      </Form.Item>
      <Form.Item label="打款备注" required>
        <Input
          v-model:value="formDesc"
          :maxlength="400"
          placeholder="请输入打款备注"
        />
      </Form.Item>
    </Form>
    <div class="mt-4 flex justify-end gap-2">
      <Button @click="handleClose">取消</Button>
      <Button :loading="saving" danger @click="handleSubmit(0)">拒绝</Button>
      <Button :loading="saving" type="primary" @click="handleSubmit(1)">
        完成打款
      </Button>
    </div>
  </Modal>
</template>
