<script lang="ts" setup>
import type { WithdrawAccountItem } from '#/types/promotion';

import { computed, ref } from 'vue';

import type { SelectValue } from 'ant-design-vue/es/select';

import {
  Form,
  Input,
  InputPassword,
  Modal,
  Select,
  message,
} from 'ant-design-vue';

import { createWithdrawApi } from '#/api/promotion/close-manage';

const props = defineProps<{
  accountList: WithdrawAccountItem[];
  accountRate: Array<{
    MaxMoney?: number;
    MinMoney?: number;
    Rate?: number;
    Type?: number;
  }>;
  maxMoney: number;
  minMoney: number;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const saving = ref(false);
const formGetMoney = ref('');
const formAccountInfo = ref<WithdrawAccountItem>();
const formPrivatePassword = ref('');

const currentRate = computed(() => {
  const account = formAccountInfo.value;
  if (!account) {
    return '';
  }
  const rateItem = props.accountRate.find(
    (item) => item.Type === account.AccountType,
  );
  if (!rateItem?.Rate) {
    return '';
  }
  return `手续费 ${rateItem.Rate}%`;
});

function handleAccountChange(value: SelectValue) {
  formAccountInfo.value = props.accountList.find((item) => item.Id === value);
}

function getAccountLabel(item: WithdrawAccountItem) {
  const typeText = item.AccountType === 2 ? '支付宝' : '银行卡';
  return `${typeText} / ${item.RealName || ''} / ${item.Account || ''}`;
}

function resetForm() {
  formGetMoney.value = '';
  formAccountInfo.value = undefined;
  formPrivatePassword.value = '';
}

function handleClose() {
  emit('update:open', false);
  resetForm();
}

async function handleSubmit() {
  if (!formGetMoney.value) {
    message.warning('请输入提现金额');
    return;
  }
  if (!/^\d+$/.test(formGetMoney.value)) {
    message.warning('请输入正确的提现金额');
    return;
  }
  const amount = Number(formGetMoney.value);
  if (
    props.minMoney &&
    props.maxMoney &&
    (amount < props.minMoney || amount > props.maxMoney)
  ) {
    message.warning(`提现金额应在 ${props.minMoney}-${props.maxMoney} 之间`);
    return;
  }
  if (!formAccountInfo.value) {
    message.warning('请选择提现账号');
    return;
  }
  if (!formPrivatePassword.value) {
    message.warning('请输入取款密码');
    return;
  }

  saving.value = true;
  try {
    await createWithdrawApi({
      Account: formAccountInfo.value.Account,
      AccountNo: formAccountInfo.value.Id,
      GetMoney: formGetMoney.value,
      PrivatePassword: formPrivatePassword.value,
    });
    message.success('提现申请已提交');
    emit('success');
    handleClose();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    title="收益提现"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="提现金额" required>
        <Input v-model:value="formGetMoney" placeholder="请输入提现金额" />
      </Form.Item>
      <Form.Item label="提现账号" required>
        <Select
          :options="
            accountList.map((item) => ({
              label: getAccountLabel(item),
              value: item.Id,
            }))
          "
          placeholder="请选择提现账号"
          @change="handleAccountChange"
        />
        <div v-if="currentRate" class="mt-1 text-red-500">
          {{ currentRate }}
        </div>
      </Form.Item>
      <Form.Item label="取款密码" required>
        <InputPassword
          v-model:value="formPrivatePassword"
          placeholder="请输入取款密码"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
