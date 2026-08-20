<script lang="ts" setup>
import type { CryptoAddressListItem } from '#/types/crypto-address';

import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import {
  createCryptoAddressApi,
  updateCryptoAddressApi,
} from '#/api/memberManage/crypto-address';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PassPopup from '#/components/security/pass-popup.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { CRYPTO_CONFIG_TYPE_OPTIONS } from '#/types/crypto-address';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'CryptoAddressFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row: CryptoAddressListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

/** 与旧站 GoogleCode page-id=18 一致 */
const CRYPTO_SECURITY_PAGE_ID = 18;

const { packageOptions } = useOperationOptions();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const submitting = ref(false);
const loginAccount = ref('');
const packageName = ref('');
const playerId = ref<number | string>('');
const digitalAddress = ref('');
const digitalAlias = ref('');
const digitalType = ref('USDT');
const digitalConfigType = ref(1);
const addressId = ref<number | string>('');

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
      addressId.value = props.row.Id || '';
      loginAccount.value = String(props.row.LoginAccount || '');
      packageName.value = String(props.row.PackageName || '');
      playerId.value = props.row.PlayerId || '';
      digitalAddress.value = String(props.row.DigitalAddress || '');
      digitalAlias.value = String(props.row.DigitalAlias || '');
      digitalType.value = String(props.row.DigitalType || 'USDT');
      digitalConfigType.value = Number(props.row.DigitalConfigType || 1);
      return;
    }
    addressId.value = '';
    loginAccount.value = '';
    packageName.value = productNameOptions.value[0]?.value || '';
    playerId.value = '';
    digitalAddress.value = '';
    digitalAlias.value = '';
    digitalType.value = 'USDT';
    digitalConfigType.value = 1;
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
  const player = result?.Items?.[0];
  if (!player?.PlayerId) {
    message.warning('未找到玩家');
    playerId.value = '';
    return;
  }
  playerId.value = player.PlayerId;
}

function validateAddress(address: string, configType: number) {
  const value = address.replaceAll(/\s/g, '');
  if (configType === 1) {
    return value.startsWith('T');
  }
  if (configType === 2) {
    return /^0x/i.test(value);
  }
  if (configType === 4) {
    return /^eb/i.test(value);
  }
  return value.length > 0;
}

async function requestSubmit() {
  if (
    !loginAccount.value ||
    !digitalAddress.value ||
    !digitalAlias.value ||
    !digitalType.value
  ) {
    message.warning('请填写完整信息');
    return;
  }
  const cleaned = digitalAddress.value.replaceAll(/\s/g, '');
  if (!validateAddress(cleaned, digitalConfigType.value)) {
    message.warning('虚拟币地址格式与所选协议不匹配');
    return;
  }
  if (props.mode === 'create' && !playerId.value) {
    await resolvePlayer();
    if (!playerId.value) {
      return;
    }
  }
  digitalAddress.value = cleaned;
  passPopupRef.value?.validate(CRYPTO_SECURITY_PAGE_ID);
}

async function handleSubmit(extra: Record<string, unknown> = {}) {
  submitting.value = true;
  try {
    const payload = {
      DigitalAddress: digitalAddress.value.replaceAll(/\s/g, ''),
      DigitalAlias: digitalAlias.value,
      DigitalConfigType: digitalConfigType.value,
      DigitalType: digitalType.value,
      LoginAccount: loginAccount.value,
      PackageName: packageName.value,
      PlayerId: playerId.value,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
      ...(props.mode === 'edit' ? { Id: addressId.value } : {}),
    };
    if (props.mode === 'create') {
      await createCryptoAddressApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('新增成功');
    } else {
      await updateCryptoAddressApi(payload);
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
    :title="mode === 'create' ? '新增虚拟币地址' : '编辑虚拟币地址'"
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
          v-model:value="packageName"
          :options="productNameOptions"
          placeholder="请选择产品"
          show-search
          @change="resolvePlayer"
        />
      </Form.Item>
      <Form.Item v-if="playerId && mode === 'create'" label="玩家ID">
        <Input :value="String(playerId)" disabled />
      </Form.Item>
      <Form.Item label="币种" required>
        <Input
          v-model:value="digitalType"
          :disabled="mode === 'edit'"
          allow-clear
          placeholder="如 USDT"
        />
      </Form.Item>
      <Form.Item label="虚拟币名称" required>
        <Select
          v-model:value="digitalConfigType"
          :options="CRYPTO_CONFIG_TYPE_OPTIONS"
        />
      </Form.Item>
      <Form.Item label="虚拟币地址" required>
        <Input
          v-model:value="digitalAddress"
          allow-clear
          placeholder="请输入虚拟币地址"
        />
      </Form.Item>
      <Form.Item label="虚拟币别名" required>
        <Input
          v-model:value="digitalAlias"
          allow-clear
          placeholder="请输入别名"
        />
      </Form.Item>
    </Form>
  </Modal>

  <PassPopup ref="passPopupRef" title="安全验证" @confirm="handleSubmit" />
</template>
