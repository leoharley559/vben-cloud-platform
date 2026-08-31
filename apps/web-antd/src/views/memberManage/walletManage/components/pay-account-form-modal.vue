<script lang="ts" setup>
import type { BankCardListItem } from '#/types/bank-card';

import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import {
  createBankCardApi,
  updateBankCardApi,
} from '#/api/memberManage/bank-card';
import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
} from '#/api/operationManage/player';
import PassPopup from '#/components/security/pass-popup.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PayAccountFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  resourceType: 'alipay' | 'wechat';
  row: BankCardListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

/** 与银行卡一致，PageId=8 */
const PAY_ACCOUNT_SECURITY_PAGE_ID = 8;

const { packageOptions } = useOperationOptions();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const submitting = ref(false);
const loginAccount = ref('');
const packageName = ref('');
const playerId = ref<number | string>('');
const accountName = ref('');
const account = ref('');
const recordId = ref<number | string>('');

const accountType = computed(() => (props.resourceType === 'alipay' ? 1 : 2));
const titleLabel = computed(() =>
  props.resourceType === 'alipay' ? '支付宝' : '微信',
);

const productNameOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

function resolveRowAccount(row: BankCardListItem) {
  if (props.resourceType === 'alipay') {
    return String(row.AlipayAccount || row.Account || '');
  }
  return String(row.WechatAccount || row.Account || '');
}

function resolveRowName(row: BankCardListItem) {
  if (props.resourceType === 'alipay') {
    return String(row.AlipayName || row.Name || '');
  }
  return String(row.WechatName || row.Name || '');
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    if (props.mode === 'edit' && props.row) {
      recordId.value = props.row.Id || '';
      loginAccount.value = String(props.row.LoginAccount || '');
      packageName.value = String(props.row.PackageName || '');
      playerId.value = props.row.PlayerId || '';
      accountName.value = resolveRowName(props.row);
      account.value = resolveRowAccount(props.row);
      return;
    }
    recordId.value = '';
    loginAccount.value = '';
    packageName.value = productNameOptions.value[0]?.value || '';
    playerId.value = '';
    accountName.value = '';
    account.value = '';
  },
);

function closeModal() {
  emit('update:open', false);
}

async function resolvePlayer() {
  if (!loginAccount.value || !packageName.value || props.mode === 'edit') {
    return;
  }
  const result = await queryPlayerByAccountApi({
    LoginAccount: loginAccount.value,
    PackageName: packageName.value,
  });
  const first = result?.Items?.[0];
  if (!first?.PlayerId) {
    message.warning('未找到对应玩家');
    playerId.value = '';
    return;
  }
  playerId.value = first.PlayerId;
  try {
    const detail = await fetchPlayerBasicInfoApi(first.PlayerId);
    if (detail?.RealName && !accountName.value) {
      accountName.value = String(detail.RealName);
    }
  } catch {
    // 详情失败不影响 PlayerId
  }
}

async function requestSubmit() {
  if (!loginAccount.value || !accountName.value.trim() || !account.value.trim()) {
    message.warning('请填写完整信息');
    return;
  }
  if (props.mode === 'create' && !playerId.value) {
    await resolvePlayer();
    if (!playerId.value) {
      return;
    }
  }
  passPopupRef.value?.validate(PAY_ACCOUNT_SECURITY_PAGE_ID);
}

async function handleSubmit(extra: Record<string, unknown> = {}) {
  submitting.value = true;
  try {
    const payload = {
      Account: account.value.trim(),
      AccountType: accountType.value,
      LoginAccount: loginAccount.value,
      Name: accountName.value.trim(),
      PackageName: packageName.value,
      PlayerId: playerId.value,
      ResourceType: 'withdrawal_account' as const,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
      ...(props.mode === 'edit' ? { Id: recordId.value } : {}),
    };
    if (props.mode === 'create') {
      await createBankCardApi({
        ...payload,
        Hash: createRequestHash(),
        OperationType: 1,
      });
      message.success(`${titleLabel.value}新增成功`);
    } else {
      await updateBankCardApi(payload);
      message.success(`${titleLabel.value}编辑成功`);
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
    :title="
      mode === 'create'
        ? `新增${titleLabel}`
        : `编辑${titleLabel}`
    "
    width="560px"
    @cancel="closeModal"
    @ok="requestSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="游戏账号" required>
        <div class="flex gap-2">
          <Input
            v-model:value="loginAccount"
            :disabled="mode === 'edit'"
            placeholder="请输入游戏账号"
            @blur="resolvePlayer"
          />
          <Select
            v-model:value="packageName"
            class="w-40"
            :disabled="mode === 'edit'"
            :options="productNameOptions"
            placeholder="产品"
            @change="resolvePlayer"
          />
        </div>
      </Form.Item>
      <Form.Item v-if="playerId" label="玩家ID">
        <Input :value="String(playerId)" disabled />
      </Form.Item>
      <Form.Item :label="`${titleLabel}名`" required>
        <Input v-model:value="accountName" :placeholder="`请输入${titleLabel}名`" />
      </Form.Item>
      <Form.Item :label="`${titleLabel}账号`" required>
        <Input
          v-model:value="account"
          :disabled="mode === 'edit'"
          :placeholder="`请输入${titleLabel}账号`"
        />
      </Form.Item>
    </Form>
  </Modal>

  <PassPopup ref="passPopupRef" title="安全验证" @confirm="handleSubmit" />
</template>
