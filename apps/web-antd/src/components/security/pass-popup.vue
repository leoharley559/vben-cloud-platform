<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Alert, Input, Modal } from 'ant-design-vue';

import { checkSecured } from './security-utils';

defineOptions({ name: 'PassPopup' });

const props = withDefaults(
  defineProps<{
    promptMsg?: string;
    title?: string;
    type?: 'csv' | 'gcode' | 'private';
  }>(),
  {
    type: 'gcode',
  },
);

const emit = defineEmits<{
  close: [];
  confirm: [data: Record<string, unknown>];
}>();

const visible = ref(false);
const showPassForm = ref(true);
const validCode = ref('');
const privatePassword = ref('');
const pendingOptions = ref<Record<string, unknown>>({});

const dialogTitle = computed(() => {
  if (props.title) {
    return props.title;
  }
  if (props.type === 'gcode') {
    return '谷歌验证码';
  }
  if (props.type === 'private') {
    return '私人密码';
  }
  return '文件密码';
});

const canConfirm = computed(() => {
  if (!showPassForm.value) {
    return true;
  }
  if (props.type === 'private') {
    return privatePassword.value.trim().length >= 6;
  }
  if (props.type === 'gcode') {
    return /^\d{6}$/.test(validCode.value);
  }
  return !!validCode.value;
});

function resetForm() {
  validCode.value = '';
  privatePassword.value = '';
  pendingOptions.value = {};
}

function openWithSecurity(
  pageId: number | string,
  options: Record<string, unknown> = {},
) {
  pendingOptions.value = { ...options };
  if (pageId && checkSecured(pageId)) {
    showPassForm.value = true;
    validCode.value = '';
    privatePassword.value = '';
    visible.value = true;
    return;
  }
  emit('confirm', { ...options });
}

/** 无安全限制时不弹窗，直接 confirm */
function validate(
  pageId?: number | string,
  options: Record<string, unknown> = {},
) {
  openWithSecurity(pageId ?? '', options);
}

/** 无安全限制时仍弹窗，但不显示密码输入框 */
function prompt(
  pageId?: number | string,
  options: Record<string, unknown> = {},
) {
  pendingOptions.value = { ...options };
  showPassForm.value = !!(pageId && checkSecured(pageId));
  validCode.value = '';
  privatePassword.value = '';
  visible.value = true;
}

function handleClose() {
  visible.value = false;
  resetForm();
  emit('close');
}

function handleConfirm() {
  if (showPassForm.value) {
    if (props.type === 'private' && privatePassword.value.trim().length < 6) {
      return;
    }
    if (props.type === 'gcode' && !/^\d{6}$/.test(validCode.value)) {
      return;
    }
  }

  let payload: Record<string, unknown> = { ...pendingOptions.value };
  if (showPassForm.value) {
    if (props.type === 'private') {
      payload = {
        ...payload,
        PrivatePassword: privatePassword.value,
      };
    } else {
      payload = {
        ...payload,
        ValidCode: validCode.value,
      };
    }
  }

  emit('confirm', payload);
  visible.value = false;
  resetForm();
}

defineExpose({
  prompt,
  validate,
});
</script>

<template>
  <Modal
    :confirm-loading="false"
    :ok-button-props="{ disabled: !canConfirm }"
    :open="visible"
    :title="dialogTitle"
    destroy-on-close
    ok-text="确认"
    cancel-text="取消"
    width="480px"
    @cancel="handleClose"
    @ok="handleConfirm"
  >
    <Alert
      v-if="promptMsg"
      class="mb-3"
      show-icon
      type="warning"
      :message="promptMsg"
    />
    <slot name="description" />
    <div v-if="showPassForm && type === 'gcode'" class="mt-2">
      <div class="mb-2 text-sm">谷歌验证码</div>
      <Input
        v-model:value="validCode"
        allow-clear
        :maxlength="6"
        placeholder="请输入6位谷歌验证码"
        @press-enter="handleConfirm"
      />
      <p class="mt-2 text-xs text-red-500">
        如未绑定谷歌验证器，请先在个人中心完成绑定。
      </p>
    </div>
    <div v-if="showPassForm && type === 'private'" class="mt-2">
      <div class="mb-2 text-sm">私人密码</div>
      <Input.Password
        v-model:value="privatePassword"
        allow-clear
        placeholder="请输入私人密码"
        @press-enter="handleConfirm"
      />
    </div>
    <slot name="extra" />
  </Modal>
</template>
