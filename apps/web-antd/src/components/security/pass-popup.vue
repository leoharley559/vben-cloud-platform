<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Alert, Input, Modal } from 'ant-design-vue';

import { checkSecured } from './security-utils';

defineOptions({ name: 'PassPopup' });

const props = withDefaults(
  defineProps<{
    promptMsg?: string;
    /** 顶部提示样式 */
    promptType?: 'error' | 'info' | 'success' | 'warning';
    title?: string;
    type?: 'csv' | 'gcode' | 'private';
  }>(),
  {
    promptType: 'warning',
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
const filePassword = ref('');
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
  // csv：对齐旧站 PrivatePassword，非空即可
  return !!filePassword.value.trim();
});

function resetForm() {
  validCode.value = '';
  privatePassword.value = '';
  filePassword.value = '';
  pendingOptions.value = {};
}

function openWithSecurity(
  pageId: number | string,
  options: Record<string, unknown> = {},
) {
  pendingOptions.value = { ...options };
  const secured = checkSecured(pageId);
  showPassForm.value = secured;
  if (!secured) {
    emit('confirm', { ...pendingOptions.value });
    return;
  }
  visible.value = true;
}

function validate(
  pageId: number | string,
  options: Record<string, unknown> = {},
) {
  openWithSecurity(pageId, options);
}

function handleCancel() {
  visible.value = false;
  resetForm();
  emit('close');
}

function handleOk() {
  if (!canConfirm.value) {
    return;
  }
  const payload: Record<string, unknown> = { ...pendingOptions.value };
  if (showPassForm.value) {
    if (props.type === 'private') {
      payload.PrivatePassword = privatePassword.value.trim();
    } else if (props.type === 'gcode') {
      payload.GoogleCode = validCode.value;
    } else {
      payload.PrivatePassword = filePassword.value.trim();
    }
  }
  visible.value = false;
  resetForm();
  emit('confirm', payload);
}

defineExpose({
  openWithSecurity,
  validate,
});
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="dialogTitle"
    destroy-on-close
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <Alert
      v-if="promptMsg"
      :message="promptMsg"
      :type="promptType"
      class="mb-3"
      show-icon
    />
    <div v-if="showPassForm" class="space-y-3">
      <template v-if="type === 'private'">
        <div class="text-sm text-muted-foreground">请输入私人密码</div>
        <Input.Password
          v-model:value="privatePassword"
          allow-clear
          placeholder="私人密码"
        />
      </template>
      <template v-else-if="type === 'gcode'">
        <div class="text-sm text-muted-foreground">请输入谷歌验证码</div>
        <Input
          v-model:value="validCode"
          allow-clear
          maxlength="6"
          placeholder="6 位验证码"
        />
      </template>
      <template v-else>
        <div class="text-sm text-muted-foreground">请输入文件密码</div>
        <Input.Password
          v-model:value="filePassword"
          allow-clear
          placeholder="文件密码"
        />
      </template>
    </div>
  </Modal>
</template>
