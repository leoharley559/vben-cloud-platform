<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { updateAccountPasswordApi } from '#/api/core/account-login';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();
const submitting = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '原密码',
      component: 'VbenInputPassword',
      rules: z.string().min(1, { message: '请输入原密码' }),
      componentProps: {
        placeholder: '请输入原密码',
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      rules: z.string().min(1, { message: '请输入新密码' }),
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await updateAccountPasswordApi({
      ConfirmPassword: String(values.confirmPassword || ''),
      NewPassword: String(values.newPassword || ''),
      OldPassword: String(values.oldPassword || ''),
    });
    message.success('密码修改成功，请重新登录');
    await authStore.logout(false);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ProfilePasswordSetting
    class="w-1/2 max-w-xl"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
