<script lang="ts" setup>
import type { AccountLoginInfo } from '#/api/core/account-login';

import { onUnmounted, ref } from 'vue';

import { Button, Form, Input, message, Select } from 'ant-design-vue';

import {
  bindAccountPhoneApi,
  fetchPhoneValidCodeApi,
  unbindAccountPhoneApi,
} from '#/api/core/account-login';

const props = defineProps<{
  info: AccountLoginInfo;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const saving = ref(false);
const sending = ref(false);
const countdown = ref(0);
const areaCode = ref('86');
const phone = ref('');
const verifyCode = ref('');
let timer: ReturnType<typeof setInterval> | undefined;

const areaOptions = [
  '86',
  '1',
  '60',
  '62',
  '63',
  '65',
  '66',
  '84',
  '82',
  '853',
  '855',
  '886',
  '852',
].map((value) => ({ label: `+ ${value}`, value }));

function clearTimer() {
  if (timer) clearInterval(timer);
  timer = undefined;
  countdown.value = 0;
}

function startCountdown() {
  clearTimer();
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) clearTimer();
  }, 1000);
}

function reset() {
  phone.value = '';
  verifyCode.value = '';
  clearTimer();
}

async function sendCode() {
  if (countdown.value > 0) return;
  const boundPhone = String(props.info.Phone || '');
  if (!boundPhone && phone.value.trim().length < 6) {
    message.warning('请输入正确的手机号');
    return;
  }
  sending.value = true;
  try {
    await fetchPhoneValidCodeApi(
      boundPhone
        ? undefined
        : { Number: `${areaCode.value}_${phone.value.trim()}` },
    );
    message.success('验证码已发送');
    startCountdown();
  } finally {
    sending.value = false;
  }
}

async function submit() {
  if (!verifyCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  const boundPhone = String(props.info.Phone || '');
  if (!boundPhone && phone.value.trim().length < 6) {
    message.warning('请输入正确的手机号');
    return;
  }
  saving.value = true;
  try {
    if (boundPhone) {
      await unbindAccountPhoneApi({ VerifyCode: verifyCode.value.trim() });
      message.success('手机号已解绑');
    } else {
      await bindAccountPhoneApi({
        AreaCode: areaCode.value,
        Phone: phone.value.trim(),
        VerifyCode: verifyCode.value.trim(),
      });
      message.success('手机号已绑定');
    }
    reset();
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

onUnmounted(clearTimer);
</script>

<template>
  <Form class="max-w-xl" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
    <Form.Item v-if="!info.Phone" label="手机号" required>
      <div class="flex gap-2">
        <Select v-model:value="areaCode" :options="areaOptions" class="w-28" />
        <Input v-model:value="phone" placeholder="请输入手机号" />
      </div>
    </Form.Item>
    <Form.Item v-else label="已绑定手机">
      <span>{{ info.Phone }}</span>
    </Form.Item>
    <Form.Item label="验证码" required>
      <div class="flex gap-2">
        <Input v-model:value="verifyCode" placeholder="短信验证码" />
        <Button :disabled="countdown > 0" :loading="sending" @click="sendCode">
          {{ countdown > 0 ? `${countdown}S` : '获取验证码' }}
        </Button>
      </div>
    </Form.Item>
    <Form.Item :wrapper-col="{ offset: 5, span: 16 }">
      <Button block :loading="saving" type="primary" @click="submit">
        {{ info.Phone ? '解除绑定' : '绑定手机' }}
      </Button>
    </Form.Item>
  </Form>
</template>
