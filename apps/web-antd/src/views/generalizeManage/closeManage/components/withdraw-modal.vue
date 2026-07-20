<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { WithdrawAccountItem } from '#/types/promotion';

import { computed, ref } from 'vue';

import {
  Form,
  Input,
  InputPassword,
  message,
  Modal,
  Select,
} from 'ant-design-vue';

import { createWithdrawApi } from '#/api/promotion/close-manage';
import { createRequestHash } from '#/utils/crypto';

const props = defineProps<{
  accountList: WithdrawAccountItem[];
  accountRate: Array<{
    MaxAmount?: number;
    MaxMoney?: number;
    MinAmount?: number;
    MinMoney?: number;
    PayType?: number;
    Rate?: number;
    ServiceRate?: number;
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
const formAccountId = ref<number | string>();
const formAccountInfo = ref<WithdrawAccountItem>();
const formPrivatePassword = ref('');

const currentRate = computed(() => {
  const account = formAccountInfo.value;
  if (!account) {
    return '';
  }
  const rateItem = props.accountRate.find(
    (item) =>
      Number(item.PayType ?? item.Type) === Number(account.AccountType),
  );
  if (!rateItem) {
    return '未设置手续费';
  }
  const rate = Number(rateItem.ServiceRate ?? rateItem.Rate ?? 0);
  const min = Number(rateItem.MinAmount ?? rateItem.MinMoney ?? 0);
  const max = Number(rateItem.MaxAmount ?? rateItem.MaxMoney ?? 0);
  return `手续费：${rate}%，提现范围：${min}-${max}`;
});

function handleAccountChange(value: SelectValue) {
  formAccountInfo.value = props.accountList.find(
    (item) => String(item.Id) === String(value),
  );
}

const selectedRange = computed(() => {
  const account = formAccountInfo.value;
  const rateItem = props.accountRate.find(
    (item) =>
      Number(item.PayType ?? item.Type) === Number(account?.AccountType),
  );
  return {
    max: Number(
      rateItem?.MaxAmount ?? rateItem?.MaxMoney ?? props.maxMoney ?? 0,
    ),
    min: Number(
      rateItem?.MinAmount ?? rateItem?.MinMoney ?? props.minMoney ?? 0,
    ),
  };
});

function getAccountLabel(item: WithdrawAccountItem) {
  const typeText = item.AccountType === 2 ? '支付宝' : '银行卡';
  return `${typeText} / ${item.RealName || ''} / ${item.Account || ''}`;
}

function resetForm() {
  formGetMoney.value = '';
  formAccountId.value = undefined;
  formAccountInfo.value = undefined;
  formPrivatePassword.value = '';
}

function handleClose() {
  if (saving.value) return;
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
    (selectedRange.value.min > 0 && amount < selectedRange.value.min) ||
    (selectedRange.value.max > 0 && amount > selectedRange.value.max)
  ) {
    message.warning(
      `提现金额应在 ${selectedRange.value.min}-${selectedRange.value.max} 之间`,
    );
    return;
  }
  const selectedAccount = formAccountInfo.value;
  if (!selectedAccount?.Id || !selectedAccount.Account) {
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
      Account: selectedAccount.Account,
      AccountNo: selectedAccount.Id,
      GetMoney: formGetMoney.value,
      Hash: createRequestHash(),
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
    :closable="!saving"
    :confirm-loading="saving"
    :mask-closable="!saving"
    :open="open"
    title="收益提现"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="提现金额" required>
        <Input
          v-model:value="formGetMoney"
          :maxlength="255"
          placeholder="请输入提现金额"
        />
      </Form.Item>
      <Form.Item label="提现账号" required>
        <Select
          v-model:value="formAccountId"
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
          :maxlength="255"
          placeholder="请输入取款密码"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
