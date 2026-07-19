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
  if (!/^[a-z0-9]+$/i.test(value)) throw new Error('邀请码只能包含字母和数字');
  if (value.length < 4 || value.length > 20) {
    throw new Error('邀请码长度须为 4-20 位');
  }
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) {
    throw new Error('邀请码必须同时包含字母和数字');
  }
  const original = String(detail.value?.InvitationCode || '').toLowerCase();
  if (
    value.toLowerCase() !== original &&
    props.existingCodes.some(
      (code) => code.toLowerCase() === value.toLowerCase(),
    )
  ) {
    throw new Error('邀请码已被当前列表中的渠道使用');
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
          placeholder="4-20 位，必须同时包含字母和数字"
          @press-enter="handleOk"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
