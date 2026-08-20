<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  InputPassword,
  message,
  Modal,
  Select,
  Tabs,
} from 'ant-design-vue';

import {
  bindAccountPhoneApi,
  fetchSecurityPhoneCodeApi,
  unbindAccountPhoneApi,
  updatePrivatePasswordApi,
} from '#/api/promotion/close-manage';

const props = defineProps<{
  info: Record<string, unknown>;
  open: boolean;
  section: 'phone' | 'private-password';
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const activeTab = ref<'phone' | 'private-password'>('phone');
const saving = ref(false);
const sending = ref(false);
const countdown = ref(0);
const areaCode = ref('86');
const phone = ref('');
const phoneCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const privateCode = ref('');
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
  phoneCode.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  privateCode.value = '';
  clearTimer();
}

async function sendCode(kind: 'phone' | 'private-password') {
  if (countdown.value > 0) return;
  const boundPhone = String(props.info.Phone || '');
  if (kind === 'phone' && !boundPhone && phone.value.trim().length < 6) {
    message.warning('请输入正确的手机号');
    return;
  }
  if (kind === 'private-password' && !boundPhone) {
    message.warning('请先绑定手机号');
    return;
  }
  sending.value = true;
  try {
    await fetchSecurityPhoneCodeApi(
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

async function submitPhone() {
  const boundPhone = String(props.info.Phone || '');
  if (!phoneCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  if (!boundPhone && phone.value.trim().length < 6) {
    message.warning('请输入正确的手机号');
    return;
  }
  saving.value = true;
  try {
    if (boundPhone) {
      await unbindAccountPhoneApi({ VerifyCode: phoneCode.value.trim() });
      message.success('手机号已解绑');
    } else {
      await bindAccountPhoneApi({
        AreaCode: areaCode.value,
        Phone: phone.value.trim(),
        VerifyCode: phoneCode.value.trim(),
      });
      message.success('手机号已绑定');
    }
    emit('success');
    emit('update:open', false);
    reset();
  } finally {
    saving.value = false;
  }
}

async function submitPrivatePassword() {
  if (!String(props.info.Phone || '')) {
    message.warning('请先绑定手机号');
    return;
  }
  if (!newPassword.value || newPassword.value !== confirmPassword.value) {
    message.warning('两次输入的密码不一致');
    return;
  }
  if (!privateCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  saving.value = true;
  try {
    await updatePrivatePasswordApi({
      ConfirmPassword: confirmPassword.value,
      NewPassword: newPassword.value,
      VerifyCode: privateCode.value.trim(),
    });
    message.success('取款密码设置成功');
    emit('success');
    emit('update:open', false);
    reset();
  } finally {
    saving.value = false;
  }
}

function close() {
  if (saving.value || sending.value) return;
  emit('update:open', false);
  reset();
}

watch(
  () => props.open,
  (open) => {
    if (open) activeTab.value = props.section;
    else reset();
  },
);

onUnmounted(clearTimer);
</script>

<template>
  <Modal
    :closable="!saving && !sending"
    :footer="null"
    :mask-closable="!saving && !sending"
    :open="open"
    title="安全设置"
    @cancel="close"
  >
    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="phone" tab="绑定手机">
        <Form layout="vertical">
          <Form.Item v-if="!info.Phone" label="手机号" required>
            <div class="flex gap-2">
              <Select
                v-model:value="areaCode"
                :options="areaOptions"
                class="w-28"
              />
              <Input v-model:value="phone" placeholder="请输入手机号" />
            </div>
          </Form.Item>
          <Form.Item v-else label="已绑定手机号">
            <Input :value="String(info.Phone)" disabled />
          </Form.Item>
          <Form.Item label="验证码" required>
            <div class="flex gap-2">
              <Input v-model:value="phoneCode" placeholder="短信验证码" />
              <Button
                :disabled="countdown > 0"
                :loading="sending"
                @click="sendCode('phone')"
              >
                {{ countdown > 0 ? `${countdown}S` : '获取验证码' }}
              </Button>
            </div>
          </Form.Item>
          <Button block :loading="saving" type="primary" @click="submitPhone">
            {{ info.Phone ? '解除绑定' : '绑定手机' }}
          </Button>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="private-password" tab="取款密码">
        <Form layout="vertical">
          <Form.Item label="取款密码" required>
            <InputPassword v-model:value="newPassword" />
          </Form.Item>
          <Form.Item label="确认密码" required>
            <InputPassword v-model:value="confirmPassword" />
          </Form.Item>
          <Form.Item label="验证码" required>
            <div class="flex gap-2">
              <Input v-model:value="privateCode" placeholder="短信验证码" />
              <Button
                :disabled="countdown > 0 || !info.Phone"
                :loading="sending"
                @click="sendCode('private-password')"
              >
                {{ countdown > 0 ? `${countdown}S` : '获取验证码' }}
              </Button>
            </div>
          </Form.Item>
          <Button
            block
            :disabled="!info.Phone"
            :loading="saving"
            type="primary"
            @click="submitPrivatePassword"
          >
            提交
          </Button>
        </Form>
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
