<script lang="ts" setup>
import type { AccountLoginInfo } from '#/api/core/account-login';

import { onUnmounted, ref } from 'vue';

import { Button, Form, Input, InputPassword, message } from 'ant-design-vue';

import {
  fetchPhoneValidCodeApi,
  updatePrivatePasswordApi,
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
const newPassword = ref('');
const confirmPassword = ref('');
const verifyCode = ref('');
let timer: ReturnType<typeof setInterval> | undefined;

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
  newPassword.value = '';
  confirmPassword.value = '';
  verifyCode.value = '';
  clearTimer();
}

async function sendCode() {
  if (countdown.value > 0) return;
  if (!String(props.info.Phone || '')) {
    message.warning('请先绑定手机号');
    return;
  }
  sending.value = true;
  try {
    await fetchPhoneValidCodeApi();
    message.success('验证码已发送');
    startCountdown();
  } finally {
    sending.value = false;
  }
}

async function submit() {
  if (!String(props.info.Phone || '')) {
    message.warning('请先绑定手机号');
    return;
  }
  if (!newPassword.value) {
    message.warning('请输入私人密码');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    message.warning('两次输入的密码不一致');
    return;
  }
  if (!verifyCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  saving.value = true;
  try {
    await updatePrivatePasswordApi({
      ConfirmPassword: confirmPassword.value,
      NewPassword: newPassword.value,
      VerifyCode: verifyCode.value.trim(),
    });
    message.success('私人密码设置成功');
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
    <Form.Item v-if="!info.Phone" :wrapper-col="{ offset: 5, span: 16 }">
      <div class="text-amber-600">请先绑定手机号后再设置私人密码</div>
    </Form.Item>
    <Form.Item label="私人密码" required>
      <InputPassword v-model:value="newPassword" placeholder="请输入私人密码" />
    </Form.Item>
    <Form.Item label="确认密码" required>
      <InputPassword
        v-model:value="confirmPassword"
        placeholder="请再次输入私人密码"
      />
    </Form.Item>
    <Form.Item label="验证码" required>
      <div class="flex gap-2">
        <Input v-model:value="verifyCode" placeholder="短信验证码" />
        <Button
          :disabled="countdown > 0 || !info.Phone"
          :loading="sending"
          @click="sendCode"
        >
          {{ countdown > 0 ? `${countdown}S` : '获取验证码' }}
        </Button>
      </div>
    </Form.Item>
    <Form.Item :wrapper-col="{ offset: 5, span: 16 }">
      <Button
        block
        :disabled="!info.Phone"
        :loading="saving"
        type="primary"
        @click="submit"
      >
        提交
      </Button>
    </Form.Item>
  </Form>
</template>
