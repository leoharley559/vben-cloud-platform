<script lang="ts" setup>
import type { AccountLoginInfo } from '#/api/core/account-login';

import { computed, ref, watch } from 'vue';

import { Button, Form, Input, message, Modal, Select } from 'ant-design-vue';
import { toDataURL } from 'qrcode';

import {
  fetchGoogleAuthSecretApi,
  updateAccountLoginSettingApi,
  updateMultiDeviceLoginApi,
} from '#/api/core/account-login';
import PassPopup from '#/components/security/pass-popup.vue';

const props = defineProps<{
  info: AccountLoginInfo;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const googleOpen = ref(false);
const saving = ref(false);
const secret = ref('');
const qrText = ref('');
const qrcodeUrl = ref('');
const validCode = ref('');
const allowOtherDevice = ref(2);

const googleBound = computed(() => Number(props.info.LoginType) === 3);
const originalAllow = computed(() =>
  Number(props.info.IsAllowOtherDeviceLogin) === 1 ? 1 : 2,
);

watch(
  () => props.info.IsAllowOtherDeviceLogin,
  () => {
    allowOtherDevice.value = originalAllow.value;
  },
  { immediate: true },
);

watch(qrText, async (text) => {
  if (!text) {
    qrcodeUrl.value = '';
    return;
  }
  try {
    qrcodeUrl.value = await toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 160,
    });
  } catch {
    qrcodeUrl.value = '';
  }
});

const deviceOptions = [
  { label: '允许', value: 1 },
  { label: '拒绝', value: 2 },
];

async function openGoogleDialog() {
  validCode.value = '';
  secret.value = '';
  qrText.value = '';
  if (googleBound.value) {
    googleOpen.value = true;
    return;
  }
  const username = String(props.info.Username || '');
  if (!username) {
    message.warning('缺少账号信息');
    return;
  }
  saving.value = true;
  try {
    const data = await fetchGoogleAuthSecretApi({ Username: username });
    secret.value = String(data?.Secret || '');
    qrText.value = String(data?.QrCode || data?.Secret || '');
    googleOpen.value = true;
  } finally {
    saving.value = false;
  }
}

async function confirmGoogle() {
  if (!/^\d{6}$/.test(validCode.value)) {
    message.warning('请输入 6 位谷歌验证码');
    return;
  }
  saving.value = true;
  try {
    await updateAccountLoginSettingApi({
      LoginType: googleBound.value ? 1 : 3,
      ValidCode: validCode.value,
    });
    message.success('操作成功');
    googleOpen.value = false;
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

function saveMultiDevice() {
  passPopupRef.value?.validate(14, {
    IsAllowOtherDeviceLogin: allowOtherDevice.value,
  });
}

async function handlePassConfirm(data: Record<string, unknown>) {
  saving.value = true;
  try {
    const payload = { ...data };
    if (payload.GoogleCode && !payload.ValidCode) {
      payload.ValidCode = payload.GoogleCode;
      delete payload.GoogleCode;
    }
    await updateMultiDeviceLoginApi(payload);
    message.success('操作成功');
    emit('refresh');
  } catch {
    allowOtherDevice.value = originalAllow.value;
  } finally {
    saving.value = false;
  }
}

function closeGoogle() {
  googleOpen.value = false;
  validCode.value = '';
  secret.value = '';
  qrText.value = '';
  qrcodeUrl.value = '';
}
</script>

<template>
  <Form class="max-w-xl" :label-col="{ span: 7 }" :wrapper-col="{ span: 16 }">
    <Form.Item label="谷歌验证码">
      <Button
        type="link"
        class="px-0"
        :loading="saving"
        @click="openGoogleDialog"
      >
        {{ googleBound ? '解绑' : '点击绑定' }}
      </Button>
    </Form.Item>
    <Form.Item label="多设备登录">
      <div class="flex items-center gap-2">
        <Select
          v-model:value="allowOtherDevice"
          :options="deviceOptions"
          class="w-40"
        />
        <Button
          type="primary"
          :disabled="allowOtherDevice === originalAllow"
          :loading="saving"
          @click="saveMultiDevice"
        >
          修改
        </Button>
      </div>
    </Form.Item>
  </Form>

  <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />

  <Modal
    :open="googleOpen"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: !/^\d{6}$/.test(validCode) }"
    destroy-on-close
    title="谷歌验证码"
    @cancel="closeGoogle"
    @ok="confirmGoogle"
  >
    <div v-if="!googleBound" class="mb-4 space-y-3">
      <div class="font-medium">1. 扫码绑定谷歌验证器</div>
      <div class="flex flex-col items-center gap-2">
        <img
          v-if="qrcodeUrl"
          :src="qrcodeUrl"
          alt="google-qrcode"
          class="size-40"
        />
        <div class="break-all text-center text-sm text-muted-foreground">
          {{ secret }}
        </div>
      </div>
      <div class="font-medium">2. 输入谷歌验证码</div>
    </div>
    <Form layout="vertical">
      <Form.Item :label="googleBound ? '谷歌验证码' : undefined" required>
        <Input
          v-model:value="validCode"
          :maxlength="6"
          placeholder="请输入 6 位验证码"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
