<script lang="ts" setup>
import type { WithdrawAccountItem } from '#/types/promotion';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createWithdrawAccountApi,
  deleteWithdrawAccountApi,
  fetchWithdrawAccountDetailApi,
  fetchWithdrawAccountListApi,
  fetchWithdrawPhoneCodeApi,
  fetchWithdrawUserInfoApi,
  updateWithdrawAccountApi,
} from '#/api/promotion/close-manage';
import { createRequestHash } from '#/utils/crypto';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  change: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const saving = ref(false);
const accountList = ref<WithdrawAccountItem[]>([]);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formId = ref<number | string>();
const formAccountType = ref(1);
const formRealName = ref('');
const formAccount = ref('');
const formBankName = ref('');
const formVerifyCode = ref('');
const boundPhone = ref('');
const codeSending = ref(false);
const codeCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

const formTitle = computed(() =>
  formMode.value === 'create' ? '新增提现账号' : '编辑提现账号',
);

const maskedPhone = computed(() => {
  if (!boundPhone.value) {
    return '';
  }
  const phone = boundPhone.value.includes('_')
    ? boundPhone.value.split('_')[1]
    : boundPhone.value;
  return phone || '';
});

const columns = [
  {
    dataIndex: 'AccountType',
    key: 'AccountType',
    title: '账号类型',
  },
  { dataIndex: 'RealName', key: 'RealName', title: '姓名' },
  { dataIndex: 'Account', key: 'Account', title: '账号' },
  { dataIndex: 'BankName', key: 'BankName', title: '开户行' },
  { key: 'action', title: '操作', width: 140 },
];

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
  codeCountdown.value = 0;
}

async function loadUserPhone() {
  try {
    const info = await fetchWithdrawUserInfoApi();
    boundPhone.value = String(info?.Phone || '');
  } catch {
    boundPhone.value = '';
  }
}

async function loadAccounts() {
  loading.value = true;
  try {
    const result = await fetchWithdrawAccountListApi();
    accountList.value = result.Items || [];
  } catch {
    accountList.value = [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  formMode.value = 'create';
  formId.value = undefined;
  formAccountType.value = 1;
  formRealName.value = '';
  formAccount.value = '';
  formBankName.value = '';
  formVerifyCode.value = '';
}

function openCreate() {
  resetForm();
  formVisible.value = true;
}

async function openEdit(row: WithdrawAccountItem) {
  if (!row.Id) {
    return;
  }
  formMode.value = 'edit';
  formVisible.value = true;
  saving.value = true;
  try {
    const detail = await fetchWithdrawAccountDetailApi(row.Id);
    formId.value = detail.Id ?? row.Id;
    formAccountType.value = Number(detail.AccountType ?? row.AccountType ?? 1);
    formRealName.value = detail.RealName || '';
    formAccount.value = detail.Account || '';
    formBankName.value = detail.BankName || '';
    formVerifyCode.value = '';
  } catch {
    message.error('加载账号详情失败');
    formVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function sendVerifyCode() {
  if (!boundPhone.value) {
    message.warning('尚未绑定手机号，无法发送验证码');
    return;
  }
  if (codeCountdown.value > 0) {
    return;
  }
  codeSending.value = true;
  try {
    await fetchWithdrawPhoneCodeApi();
    message.success('验证码已发送');
    clearCountdown();
    codeCountdown.value = 60;
    countdownTimer = setInterval(() => {
      if (codeCountdown.value <= 1) {
        clearCountdown();
        return;
      }
      codeCountdown.value -= 1;
    }, 1000);
  } finally {
    codeSending.value = false;
  }
}

async function handleSubmit() {
  if (saving.value) return;
  if (!formRealName.value.trim() || !formAccount.value.trim()) {
    message.warning('请填写完整账号信息');
    return;
  }
  if (formAccountType.value === 1 && !formBankName.value.trim()) {
    message.warning('请填写开户行');
    return;
  }
  if (!formVerifyCode.value.trim()) {
    message.warning('请输入短信验证码');
    return;
  }
  saving.value = true;
  try {
    const payload: WithdrawAccountItem = {
      Account: formAccount.value.trim(),
      AccountType: formAccountType.value,
      BankName: formBankName.value.trim(),
      RealName: formRealName.value.trim(),
      VerifyCode: formVerifyCode.value.trim(),
    };
    if (formMode.value === 'create') {
      await createWithdrawAccountApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('添加成功');
    } else {
      await updateWithdrawAccountApi({
        ...payload,
        Id: formId.value,
      });
      message.success('编辑成功');
    }
    formVisible.value = false;
    resetForm();
    await loadAccounts();
    emit('change');
  } catch {
    // requestClient 已提示业务错误（如 10173）
  } finally {
    saving.value = false;
  }
}

function closeForm() {
  if (saving.value) return;
  formVisible.value = false;
  resetForm();
}

async function handleDelete(id?: number | string) {
  if (!id) {
    return;
  }
  try {
    await deleteWithdrawAccountApi(id);
    message.success('删除成功');
    await loadAccounts();
    emit('change');
  } catch {
    // requestClient 已提示业务错误（如 10002）
  }
}

function handleClose() {
  emit('update:open', false);
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      void loadAccounts();
      void loadUserPhone();
    } else {
      clearCountdown();
    }
  },
);

onMounted(() => {
  if (props.open) {
    void loadAccounts();
    void loadUserPhone();
  }
});

onUnmounted(() => {
  clearCountdown();
});
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    title="提现账号管理"
    width="760px"
    @cancel="handleClose"
  >
    <div class="mb-3 text-right">
      <Button type="primary" @click="openCreate">新增账号</Button>
    </div>
    <Table
      bordered
      :columns="columns"
      :data-source="accountList"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'AccountType'">
          {{ record.AccountType === 2 ? '支付宝' : '银行卡' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
            <Popconfirm
              title="确认删除该账号？"
              @confirm="handleDelete(record.Id)"
            >
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :closable="!saving"
      :confirm-loading="saving"
      :mask-closable="!saving"
      :open="formVisible"
      :title="formTitle"
      @cancel="closeForm"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="账号类型" required>
          <Radio.Group v-model:value="formAccountType">
            <Radio :value="2">支付宝</Radio>
            <Radio :value="1">银行卡</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="姓名" required>
          <Input v-model:value="formRealName" />
        </Form.Item>
        <Form.Item label="账号" required>
          <Input v-model:value="formAccount" />
        </Form.Item>
        <Form.Item v-if="formAccountType === 1" label="开户行" required>
          <Input v-model:value="formBankName" />
        </Form.Item>
        <Form.Item label="验证码" required>
          <div class="flex gap-2">
            <Input
              v-model:value="formVerifyCode"
              class="flex-1"
              placeholder="短信验证码"
            />
            <Button
              :disabled="!boundPhone || codeCountdown > 0"
              :loading="codeSending"
              @click="sendVerifyCode"
            >
              {{
                codeCountdown > 0 ? `${codeCountdown}S 后重获` : '获取验证码'
              }}
            </Button>
          </div>
          <div class="mt-1 text-xs text-gray-500">
            <span v-if="maskedPhone">已绑定手机：{{ maskedPhone }}</span>
            <span v-else>尚未绑定手机号</span>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </Modal>
</template>
