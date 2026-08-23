<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { EWalletListItem } from '#/types/e-wallet';

import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import {
  createEWalletApi,
  updateEWalletApi,
} from '#/api/memberManage/e-wallet';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PassPopup from '#/components/security/pass-popup.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { E_WALLET_PAY_TYPES } from '#/types/e-wallet';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'EWalletFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row: EWalletListItem | null;
}>();
const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();
/** 与旧站 GoogleCode page-id=9 一致 */
const E_WALLET_SECURITY_PAGE_ID = 9;
const ACCOUNT_PATTERN = /^(?=.{11,12}$)(09|639|\*)[0-9*]*$/;

const { packageOptions } = useOperationOptions();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const submitting = ref(false);
const loginAccount = ref('');
const packageId = ref<number | string>('');
const packageName = ref('');
const playerId = ref<number | string>('');
const account = ref('');
const accountName = ref('');
const payType = ref<number | string>('');
const walletId = ref<number | string>('');

const packageSelectOptions = computed(() =>
  packageOptions.value.filter((item) => item.PackageId !== ''),
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    if (props.mode === 'edit' && props.row) {
      walletId.value = props.row.Id || '';
      loginAccount.value = String(props.row.LoginAccount || '');
      packageId.value = props.row.PackageId || '';
      packageName.value = String(props.row.PackageName || '');
      playerId.value = props.row.PlayerId || '';
      account.value = String(props.row.Account || '');
      accountName.value = String(props.row.Name || '');
      payType.value = props.row.PayType ?? '';
      return;
    }
    walletId.value = '';
    loginAccount.value = '';
    packageId.value = packageSelectOptions.value[0]?.PackageId ?? '';
    packageName.value = packageSelectOptions.value[0]?.PackageName || '';
    playerId.value = '';
    account.value = '';
    accountName.value = '';
    payType.value = E_WALLET_PAY_TYPES[0]?.value ?? '';
  },
);

function closeModal() {
  emit('update:open', false);
}

function onPackageChange(value: SelectValue) {
  if (value === undefined || value === null) {
    packageId.value = '';
    packageName.value = '';
    return;
  }
  packageId.value = value as number | string;
  packageName.value =
    packageSelectOptions.value.find((item) => item.PackageId === value)
      ?.PackageName || '';
  resolvePlayer();
}

async function resolvePlayer() {
  if (!loginAccount.value || !packageName.value || props.mode === 'edit') {
    return;
  }
  const result = await queryPlayerByAccountApi({
    LoginAccount: loginAccount.value,
    PackageName: packageName.value,
  });
  const player = result?.Items?.[0];
  if (!player?.PlayerId) {
    message.warning('未找到玩家');
    playerId.value = '';
    return;
  }
  playerId.value = player.PlayerId;
}

async function requestSubmit() {
  if (
    !loginAccount.value ||
    !account.value ||
    !accountName.value ||
    !payType.value
  ) {
    message.warning('请填写完整信息');
    return;
  }
  if (!ACCOUNT_PATTERN.test(account.value)) {
    message.warning('钱包账号格式不正确（11–12 位，09/639 开头）');
    return;
  }
  if (props.mode === 'create' && !playerId.value) {
    await resolvePlayer();
    if (!playerId.value) {
      return;
    }
  }
  passPopupRef.value?.validate(E_WALLET_SECURITY_PAGE_ID);
}

async function handleSubmit(extra: Record<string, unknown> = {}) {
  submitting.value = true;
  try {
    const payload = {
      Account: account.value,
      LoginAccount: loginAccount.value,
      Name: accountName.value,
      PackageId: packageId.value || props.row?.PackageId,
      PayType: payType.value,
      PlayerId: playerId.value,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
      ...(props.mode === 'edit' ? { Id: walletId.value } : {}),
    };
    if (props.mode === 'create') {
      await createEWalletApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('新增成功');
    } else {
      await updateEWalletApi(payload);
      message.success('编辑成功');
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
    :title="mode === 'create' ? '新增电子钱包' : '编辑电子钱包'"
    destroy-on-close
    width="520px"
    @cancel="closeModal"
    @ok="requestSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="游戏账号" required>
        <Input
          v-model:value="loginAccount"
          :disabled="mode === 'edit'"
          allow-clear
          placeholder="请输入游戏账号"
          @blur="resolvePlayer"
        />
      </Form.Item>
      <Form.Item v-if="mode === 'create'" label="所属产品" required>
        <Select
          v-model:value="packageId"
          :field-names="{ label: 'PackageName', value: 'PackageId' }"
          :options="packageSelectOptions"
          placeholder="请选择产品"
          show-search
          @change="onPackageChange"
        />
      </Form.Item>
      <Form.Item v-if="playerId && mode === 'create'" label="玩家ID">
        <Input :value="String(playerId)" disabled />
      </Form.Item>
      <Form.Item v-if="mode === 'create'" label="钱包类型" required>
        <Select
          v-model:value="payType"
          :options="E_WALLET_PAY_TYPES"
          placeholder="请选择钱包类型"
        />
      </Form.Item>
      <Form.Item label="钱包账号" required>
        <Input
          v-model:value="account"
          allow-clear
          placeholder="请输入钱包账号"
        />
      </Form.Item>
      <Form.Item label="账户名称" required>
        <Input
          v-model:value="accountName"
          :disabled="mode === 'edit'"
          allow-clear
          placeholder="请输入账户名称"
        />
      </Form.Item>
    </Form>
  </Modal>

  <PassPopup ref="passPopupRef" title="安全验证" @confirm="handleSubmit" />
</template>
