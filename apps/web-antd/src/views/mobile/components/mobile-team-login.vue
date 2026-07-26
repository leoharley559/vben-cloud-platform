<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';

import { Input, message, Modal } from 'ant-design-vue';

import { fetchLoginCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

const props = withDefaults(
  defineProps<{
    redirectPath?: string;
    title?: string;
  }>(),
  {
    redirectPath: '/mobile/index',
    title: '代理移动端登录',
  },
);

const authStore = useAuthStore();
const router = useRouter();

const captchaImage = ref('');
const captchaTimestamp = ref('');
let captchaTimer: ReturnType<typeof setInterval> | undefined;

const showTwoFactor = ref(false);
const twoFactorUsername = ref('');
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
  } catch {
    captchaImage.value = '';
    captchaTimestamp.value = '';
  }
}

function renderCaptchaAddon() {
  return h(
    'div',
    {
      class: 'flex h-full cursor-pointer items-center justify-center bg-white',
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

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInput',
    componentProps: { placeholder: '请输入用户名' },
    fieldName: 'username',
    label: '用户名',
    rules: z.string().min(1, { message: '请输入用户名' }),
  },
  {
    component: 'VbenInputPassword',
    componentProps: { placeholder: '请输入密码' },
    fieldName: 'password',
    label: '密码',
    rules: z.string().min(1, { message: '请输入密码' }),
  },
  {
    component: 'VbenInput',
    componentProps: { placeholder: '请输入验证码' },
    fieldName: 'captcha',
    label: '验证码',
    rules: z.string().min(1, { message: '请输入验证码' }),
    suffix: renderCaptchaAddon,
  },
]);

async function handleLogin(values: Record<string, string>) {
  const { loginResult } = await authStore.authLogin(
    {
      IsTeam: true,
      PicNumber: values.captcha,
      Pwd: values.password,
      Timestamp: captchaTimestamp.value,
      UserName: values.username,
    },
    async () => {
      await router.push(props.redirectPath);
    },
  );

  if (loginResult?.require2FA) {
    twoFactorUsername.value = values.username || '';
    showTwoFactor.value = true;
    return;
  }

  if (!loginResult?.accessToken) {
    await refreshCaptcha();
  }
}

async function submitTwoFactor() {
  if (!googleCode.value) {
    message.warning('请输入验证码');
    return;
  }
  await authStore.authLoginBy2FA(
    {
      Username: twoFactorUsername.value,
      ValidCode: googleCode.value,
    },
    async () => {
      showTwoFactor.value = false;
      await router.push(props.redirectPath);
    },
  );
}

onMounted(() => {
  refreshCaptcha();
  captchaTimer = setInterval(refreshCaptcha, 120_000);
});

onUnmounted(() => {
  if (captchaTimer) clearInterval(captchaTimer);
});
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-md items-center bg-white p-6">
    <div class="w-full">
      <h1 class="mb-6 text-center text-xl font-semibold">{{ title }}</h1>
      <AuthenticationLogin
        :form-schema="formSchema"
        :loading="authStore.loginLoading"
        :show-code-login="false"
        :show-forget-password="false"
        :show-qrcode-login="false"
        :show-register="false"
        :show-remember-me="false"
        :show-third-party-login="false"
        @submit="handleLogin"
      />
      <Modal
        v-model:open="showTwoFactor"
        :confirm-loading="authStore.twoFactorLoading"
        title="二次验证"
        @ok="submitTwoFactor"
      >
        <Input
          v-model:value="googleCode"
          placeholder="请输入谷歌/短信验证码"
          @press-enter="submitTwoFactor"
        />
      </Modal>
    </div>
  </div>
</template>
