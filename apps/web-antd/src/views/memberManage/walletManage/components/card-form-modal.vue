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
import { useProjectConfig } from '#/composables/use-project-config';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'CardFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row: BankCardListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

/** 与旧站 GoogleCode page-id=8 一致 */
const BANK_CARD_SECURITY_PAGE_ID = 8;

const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const submitting = ref(false);
const loginAccount = ref('');
const packageName = ref('');
const playerId = ref<number | string>('');
const bankRealName = ref('');
const bankCardNum = ref('');
const bankCode = ref('');
const cardId = ref<number | string>('');

const bankOptions = computed(() => {
  const list = projectConfig.value?.BankList as
    | Array<{ BankCode?: string; BankName?: string; IsOpen?: boolean | number }>
    | undefined;
  return (list || [])
    .filter((item) => item.BankCode && Number(item.IsOpen) === 1)
    .map((item) => ({
      label: item.BankName || item.BankCode || '',
      value: item.BankCode || '',
    }));
});

const productNameOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    if (props.mode === 'edit' && props.row) {
      cardId.value = props.row.Id || '';
      loginAccount.value = String(props.row.LoginAccount || '');
      packageName.value = String(props.row.PackageName || '');
      playerId.value = props.row.PlayerId || '';
      bankRealName.value = String(
        props.row.RealName || props.row.BankRealName || '',
      );
      bankCardNum.value = String(props.row.BankCardNum || '');
      bankCode.value = String(props.row.BankCode || '');
      return;
    }
    cardId.value = '';
    loginAccount.value = '';
    packageName.value = productNameOptions.value[0]?.value || '';
    playerId.value = '';
    bankRealName.value = '';
    bankCardNum.value = '';
    bankCode.value = '';
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
    if (detail?.RealName) {
      bankRealName.value = String(detail.RealName);
    }
  } catch {
    // 详情失败不影响 PlayerId
  }
}

async function requestSubmit() {
  if (
    !loginAccount.value ||
    !bankRealName.value ||
    !bankCardNum.value ||
    !bankCode.value
  ) {
    message.warning('请填写完整信息');
    return;
  }
  if (!/^.{10,16}$/.test(bankCardNum.value)) {
    message.warning('银行卡号长度需为 10–16 位');
    return;
  }
  if (props.mode === 'create' && !playerId.value) {
    await resolvePlayer();
    if (!playerId.value) {
      return;
    }
  }
  passPopupRef.value?.validate(BANK_CARD_SECURITY_PAGE_ID);
}

async function handleSubmit(extra: Record<string, unknown> = {}) {
  submitting.value = true;
  try {
    const payload = {
      BankCardNum: bankCardNum.value,
      BankCode: bankCode.value,
      BankRealName: bankRealName.value,
      LoginAccount: loginAccount.value,
      PackageName: packageName.value,
      PlayerId: playerId.value,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
      ...(props.mode === 'edit' ? { Id: cardId.value } : {}),
    };
    if (props.mode === 'create') {
      await createBankCardApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('新增成功');
    } else {
      await updateBankCardApi(payload);
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
    :title="mode === 'create' ? '新增银行卡' : '编辑银行卡'"
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
      <Form.Item label="开户姓名" required>
        <Input v-model:value="bankRealName" placeholder="请输入开户姓名" />
      </Form.Item>
      <Form.Item label="银行卡号" required>
        <Input
          v-model:value="bankCardNum"
          :disabled="mode === 'edit'"
          placeholder="请输入银行卡号"
        />
      </Form.Item>
      <Form.Item label="银行名称" required>
        <Select
          v-model:value="bankCode"
          allow-clear
          :options="bankOptions"
          placeholder="请选择银行"
          show-search
        />
      </Form.Item>
    </Form>
  </Modal>

  <PassPopup ref="passPopupRef" title="安全验证" @confirm="handleSubmit" />
</template>
