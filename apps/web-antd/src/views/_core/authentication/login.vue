<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, h, onMounted, onUnmounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Input, message, Modal } from 'ant-design-vue';

import { fetchLoginCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const captchaImage = ref('');
const captchaTimestamp = ref('');
let captchaTimer: ReturnType<typeof setInterval> | undefined;

/** 二次验证（谷歌验证码） */
const showTwoFactor = ref(false);
const twoFactorUsername = ref('');
const twoFactorLoginType = ref(3);
const googleCode = ref('');

function normalizeCaptchaSrc(item: string) {
  if (!item) return '';
  if (item.startsWith('data:')) return item;
  return `data:image/png;base64,${item}`;
}

async function refreshCaptcha() {
  try {
    const data = await fetchLoginCaptchaApi();
    captchaImage.value = normalizeCaptchaSrc(data?.Item || '');
    captchaTimestamp.value = data?.KeyCode || '';
  } catch (error) {
    console.error('[captcha] failed', error);
    captchaImage.value = '';
    captchaTimestamp.value = '';
  }
}

function renderCaptchaAddon() {
  return h(
    'div',
    {
      class:
        'keep-light-bg flex h-full cursor-pointer items-center justify-center bg-white',
      style: { minWidth: '96px', height: '38px', borderRadius: '4px', padding: '0 4px' },
      title: '点击刷新验证码',
      onClick: () => refreshCaptcha(),
    },
    captchaImage.value
      ? h('img', {
          alt: '验证码',
          class: 'h-9 select-none',
          src: captchaImage.value,
        })
      : h('span', { class: 'text-xs text-gray-500' }, '刷新验证码'),
  );
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入验证码',
      },
      fieldName: 'captcha',
      label: '验证码',
      rules: z.string().min(1, { message: '请输入验证码' }),
      suffix: renderCaptchaAddon,
    },
  ];
});

function openTwoFactorModal(username: string, loginType = 3) {
  twoFactorUsername.value = username;
  twoFactorLoginType.value = loginType;
  googleCode.value = '';
  showTwoFactor.value = true;
}

function closeTwoFactorModal() {
  showTwoFactor.value = false;
  googleCode.value = '';
}

async function handleSubmit(values: Record<string, any>) {
  if (!captchaTimestamp.value) {
    message.warning('验证码未就绪，请先刷新验证码');
    await refreshCaptcha();
    return;
  }

  try {
    const { loginResult } = await authStore.authLogin({
      PicNumber: values.captcha,
      Pwd: values.password,
      Timestamp: captchaTimestamp.value,
      UserName: values.username,
    });

    // 需要谷歌 / 短信二次验证
    if (loginResult?.require2FA) {
      openTwoFactorModal(values.username, loginResult.loginType ?? 3);
      return;
    }
  } finally {
    await refreshCaptcha();
  }
}

async function handleTwoFactorSubmit() {
  const code = googleCode.value.trim();
  if (!code) {
    message.warning('请输入谷歌验证码');
    return;
  }

  try {
    await authStore.authLoginBy2FA({
      UseNewPermission: true,
      Username: twoFactorUsername.value,
      ValidCode: code,
    });
    closeTwoFactorModal();
  } catch {
    googleCode.value = '';
  }
}

onMounted(() => {
  void refreshCaptcha();
  captchaTimer = setInterval(() => {
    void refreshCaptcha();
  }, 120_000);
});

onUnmounted(() => {
  if (captchaTimer) {
    clearInterval(captchaTimer);
  }
});
</script>

<template>
  <div>
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="false"
      :show-forget-password="false"
      :show-qrcode-login="false"
      :show-register="false"
      :show-third-party-login="false"
      @submit="handleSubmit"
    />

    <Modal
      v-model:open="showTwoFactor"
      :confirm-loading="authStore.twoFactorLoading"
      :mask-closable="false"
      destroy-on-close
      ok-text="登录"
      title="谷歌验证码"
      @cancel="closeTwoFactorModal"
      @ok="handleTwoFactorSubmit"
    >
      <p class="text-muted-foreground mb-3 text-sm">
        账号
        <span class="text-foreground font-medium">{{ twoFactorUsername }}</span>
        已绑定谷歌验证器，请输入动态验证码
      </p>
      <Input
        v-model:value="googleCode"
        allow-clear
        placeholder="请输入谷歌验证码"
        size="large"
        @press-enter="handleTwoFactorSubmit"
      />
    </Modal>
  </div>
</template>
