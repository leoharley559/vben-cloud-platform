<script lang="ts" setup>
import type { AccountLoginInfo } from '#/api/core/account-login';

import { computed, ref, watch } from 'vue';

import { Button, Form, Input, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { updateAccountNameApi } from '#/api/core/account-login';

const props = defineProps<{
  info: AccountLoginInfo;
}>();

const emit = defineEmits<{
  refresh: [];
  'switch-tab': [tab: string];
}>();

const editing = ref(false);
const saving = ref(false);
const nickname = ref('');

watch(
  () => props.info.Name,
  (name) => {
    nickname.value = String(name || '');
  },
  { immediate: true },
);

const phoneBound = computed(() => !!props.info.Phone);
const privatePasswordSet = computed(
  () => Number(props.info.IsSetPrivatePassword) === 1,
);
const loginTypeText = computed(() => {
  const type = Number(props.info.LoginType);
  if (type === 3) return '谷歌验证码';
  if (type === 2) return '短信验证码';
  return '图形验证码';
});
const multiDeviceText = computed(() =>
  Number(props.info.IsAllowOtherDeviceLogin) === 1 ? '允许多设备' : '不允许多设备',
);

function formatDateTime(value?: number | string) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return dayjs(String(value).length > 10 ? numeric : numeric * 1000).format(
    'YYYY-MM-DD HH:mm:ss',
  );
}

function startEdit() {
  nickname.value = String(props.info.Name || '');
  editing.value = true;
}

function cancelEdit() {
  nickname.value = String(props.info.Name || '');
  editing.value = false;
}

async function saveNickname() {
  const name = nickname.value.trim();
  if (!name) {
    message.warning('请输入昵称');
    return;
  }
  saving.value = true;
  try {
    await updateAccountNameApi({ Name: name });
    message.success('保存成功');
    editing.value = false;
    emit('refresh');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 14 }" class="max-w-3xl">
    <Form.Item label="账号">
      <span>{{ info.Username || '-' }}</span>
    </Form.Item>
    <Form.Item label="昵称">
      <div v-if="!editing" class="flex items-center gap-3">
        <span>{{ info.Name || '-' }}</span>
        <Button type="link" class="px-0" @click="startEdit">编辑</Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <Input v-model:value="nickname" :maxlength="32" class="max-w-xs" />
        <Button :loading="saving" type="primary" @click="saveNickname">
          保存
        </Button>
        <Button :disabled="saving" @click="cancelEdit">取消</Button>
      </div>
    </Form.Item>
    <Form.Item label="创建时间">
      <span>{{ formatDateTime(info.CreateTime) }}</span>
    </Form.Item>
    <Form.Item label="金币库存">
      <span>{{ info.Scores ?? '-' }}</span>
    </Form.Item>
    <Form.Item label="当前云币">
      <span>{{ info.CloudCoin ?? '-' }}</span>
    </Form.Item>
    <Form.Item label="登录次数">
      <span>{{ info.Count ?? '-' }}</span>
    </Form.Item>
    <Form.Item label="最近登录">
      <span>{{ info.Ip || '-' }} | {{ info.Address || '-' }}</span>
    </Form.Item>
    <Form.Item label="绑定手机">
      <span v-if="phoneBound">{{ info.Phone }}</span>
      <Button
        v-else
        type="link"
        class="px-0"
        @click="emit('switch-tab', 'phone')"
      >
        未绑定
      </Button>
    </Form.Item>
    <Form.Item label="私人密码">
      <span v-if="privatePasswordSet">已设置</span>
      <Button
        v-else
        type="link"
        class="px-0"
        @click="emit('switch-tab', 'private')"
      >
        未设置
      </Button>
    </Form.Item>
    <Form.Item label="登录与安全">
      <span>{{ loginTypeText }} / {{ multiDeviceText }}</span>
      <Button
        type="link"
        class="px-0"
        @click="emit('switch-tab', 'login-security')"
      >
        去设置
      </Button>
    </Form.Item>
  </Form>
</template>
