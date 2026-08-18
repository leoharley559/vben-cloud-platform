<script lang="ts" setup>
import type { ChannelDetail, ChannelId } from '#/types/channel-config';

import { reactive, ref, watch } from 'vue';

import { Form, FormItem, Input, message, Modal } from 'ant-design-vue';

import {
  fetchChannelDetailApi,
  updateChannelInvitationCodeApi,
} from '#/api/gameManage/channel';

const props = defineProps<{
  channelId?: ChannelId;
  existingCodes: string[];
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const detail = ref<ChannelDetail>();
const loading = ref(false);
const saving = ref(false);
const form = reactive({ InvitationCode: '' });

async function loadDetail() {
  if (!props.channelId) return;
  loading.value = true;
  try {
    detail.value = await fetchChannelDetailApi(props.channelId);
    form.InvitationCode = String(detail.value.InvitationCode || '');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) void loadDetail();
  },
);

async function validateInvitationCode() {
  const value = form.InvitationCode.trim();
  if (!value) throw new Error('请输入邀请码');
  const original = String(detail.value?.InvitationCode || '');
  // 历史短码（如 100/103）允许原样保留；仅改码时对齐旧站规则
  if (value.toLowerCase() !== original.toLowerCase()) {
    const pattern = /^([a-z]+\d+|\d+[a-z]+)[a-z0-9]*$/i;
    if (!pattern.test(value) || value.length < 4 || value.length > 20) {
      throw new Error('邀请码须为 4-20 位，且同时包含字母和数字');
    }
    if (
      props.existingCodes.some(
        (code) => code.toLowerCase() === value.toLowerCase(),
      )
    ) {
      throw new Error('邀请码已被当前列表中的渠道使用');
    }
  }
}

async function handleOk() {
  try {
    await validateInvitationCode();
  } catch (error) {
    message.warning(
      error instanceof Error ? error.message : '邀请码格式不正确',
    );
    return;
  }
  if (!detail.value) return;
  saving.value = true;
  try {
    await updateChannelInvitationCodeApi({
      ...detail.value,
      InvitationCode: form.InvitationCode.trim(),
      PromoterAdminId: detail.value.AdminId,
      ReqPathType: 2,
    });
    message.success('邀请码修改成功');
    emit('update:open', false);
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :loading="loading"
    :open="open"
    title="编辑邀请码"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <FormItem
        label="邀请码"
        name="InvitationCode"
        required
        :validate-trigger="['blur', 'change']"
      >
        <Input
          v-model:value="form.InvitationCode"
          :maxlength="20"
          @press-enter="handleOk"
          placeholder="请输入字母+数字组合，4-20 位；历史短码可原样保留"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
