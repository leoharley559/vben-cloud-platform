<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
} from 'ant-design-vue';

import {
  createWithdrawAccountApi,
  fetchWithdrawAccountDetailApi,
  updateWithdrawAccountApi,
} from '#/api/gameManage';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'WithdrawAccountFormModal' });

const props = defineProps<{
  accountType?: number;
  handleType?: number;
  open: boolean;
  rowId?: null | number | string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const loading = ref(false);
const isEdit = computed(() => !!props.rowId);

const PROVINCE_OPTIONS = [
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '台湾省',
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  '香港特别行政区',
  '澳门特别行政区',
].map((label) => ({ label, value: label }));

const form = reactive({
  AccountNum: '',
  AccountType: 2,
  AlipayAppId: '',
  AlipayPriKey: '',
  AlipayPubKey: '',
  HandleType: 1,
  Id: undefined as number | string | undefined,
  MaxMoney: undefined as number | undefined,
  MaxOrderMoney: undefined as number | undefined,
  MinMoney: undefined as number | undefined,
  MinOrderMoney: undefined as number | undefined,
  RealName: '',
  UsualAddr: undefined as string | undefined,
});

function resetForm() {
  form.Id = undefined;
  form.AccountType = props.accountType || 2;
  form.HandleType = props.handleType || 1;
  form.AccountNum = '';
  form.AlipayAppId = '';
  form.AlipayPriKey = '';
  form.AlipayPubKey = '';
  form.RealName = '';
  form.UsualAddr = undefined;
  form.MinMoney = undefined;
  form.MaxMoney = undefined;
  form.MinOrderMoney = undefined;
  form.MaxOrderMoney = undefined;
}

function toYuan(value: unknown) {
  const num = Number(value || 0);
  return num ? Number((num / 100).toFixed(2)) : undefined;
}

async function loadDetail(id: number | string) {
  loading.value = true;
  try {
    const detail = await fetchWithdrawAccountDetailApi(id);
    form.Id = detail.Id as number | string;
    form.AccountType = Number(detail.AccountType || 2);
    form.HandleType = Number(detail.HandleType || 2);
    form.AccountNum = String(detail.AccountNum || detail.Account || '');
    form.AlipayAppId = String(detail.AlipayAppId || '');
    form.AlipayPriKey = String(detail.AlipayPriKey || '');
    form.AlipayPubKey = String(detail.AlipayPubKey || '');
    form.RealName = String(detail.RealName || detail.AccountName || '');
    form.UsualAddr = String(detail.UsualAddr || '') || undefined;
    form.MinMoney = toYuan(detail.MinMoney);
    form.MaxMoney = toYuan(detail.MaxMoney);
    form.MinOrderMoney = toYuan(detail.MinOrderMoney);
    form.MaxOrderMoney = toYuan(detail.MaxOrderMoney);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.rowId],
  async ([open]) => {
    if (!open) {
      return;
    }
    resetForm();
    if (props.rowId) {
      await loadDetail(props.rowId);
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

function validateForm() {
  if (!form.AccountNum.trim()) {
    message.warning('请填写账号');
    return false;
  }
  if (form.HandleType === 1 && !form.AlipayAppId.trim()) {
    message.warning('请填写支付宝应用 ID');
    return false;
  }
  if (form.HandleType === 1 && !form.AlipayPubKey.trim()) {
    message.warning('请填写支付宝公钥');
    return false;
  }
  if (form.HandleType === 1 && !form.AlipayPriKey.trim()) {
    message.warning('请填写支付宝私钥');
    return false;
  }
  if (form.HandleType === 2 && !form.RealName.trim()) {
    message.warning('请填写账户姓名');
    return false;
  }
  if (!form.UsualAddr) {
    message.warning('请选择常用地址');
    return false;
  }
  if (
    form.MinMoney === undefined ||
    form.MaxMoney === undefined ||
    form.MinMoney <= 0 ||
    form.MaxMoney <= 0
  ) {
    message.warning('请填写大于 0 的每日最小和最大限额');
    return false;
  }
  if (
    form.MinMoney !== undefined &&
    form.MaxMoney !== undefined &&
    form.MaxMoney < form.MinMoney
  ) {
    message.warning('每日最大限额不能小于最小限额');
    return false;
  }
  if (
    (form.MinOrderMoney === undefined) !==
    (form.MaxOrderMoney === undefined)
  ) {
    message.warning('单笔最小和最大限额必须同时填写');
    return false;
  }
  if (
    form.MinOrderMoney !== undefined &&
    form.MaxOrderMoney !== undefined &&
    form.MaxOrderMoney < form.MinOrderMoney
  ) {
    message.warning('单笔最大限额不能小于最小限额');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value && form.Id) {
      await updateWithdrawAccountApi({
        AccountNum: form.AccountNum.trim(),
        AccountType: form.AccountType,
        AlipayAppId: form.AlipayAppId.trim(),
        AlipayPriKey: form.AlipayPriKey.trim(),
        AlipayPubKey: form.AlipayPubKey.trim(),
        HandleType: form.HandleType,
        Id: form.Id,
        MaxMoney: Math.round(Number(form.MaxMoney || 0) * 100),
        MaxOrderMoney: Math.round(Number(form.MaxOrderMoney || 0) * 100),
        MinMoney: Math.round(Number(form.MinMoney || 0) * 100),
        MinOrderMoney: Math.round(Number(form.MinOrderMoney || 0) * 100),
        RealName: form.RealName.trim(),
        UsualAddr: form.UsualAddr,
      });
      message.success('账户已更新');
    } else {
      // 后端创建接口沿用旧契约按「元」提交；编辑接口按「分」提交。
      await createWithdrawAccountApi({
        AccountNum: form.AccountNum.trim(),
        AccountType: form.AccountType,
        AlipayAppId: form.AlipayAppId.trim(),
        AlipayPriKey: form.AlipayPriKey.trim(),
        AlipayPubKey: form.AlipayPubKey.trim(),
        HandleType: form.HandleType,
        Hash: createRequestHash(),
        MaxMoney: String(form.MaxMoney ?? ''),
        MaxOrderMoney: String(form.MaxOrderMoney ?? ''),
        MinMoney: String(form.MinMoney ?? ''),
        MinOrderMoney: String(form.MinOrderMoney ?? ''),
        RealName: form.RealName.trim(),
        UsualAddr: form.UsualAddr,
      });
      message.success('账户已创建');
    }
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting || loading"
    :open="open"
    :title="
      isEdit
        ? '编辑提现账户'
        : form.HandleType === 1
          ? '新增签约支付宝账户'
          : '新增普通支付宝账户'
    "
    :width="560"
    destroy-on-close
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form :label-col="{ span: 7 }" class="mt-2" layout="horizontal">
      <Form.Item label="账号类型">
        <Select
          v-model:value="form.HandleType"
          :disabled="isEdit"
          :options="[
            { label: '签约账户', value: 1 },
            { label: '普通账户', value: 2 },
          ]"
        />
      </Form.Item>
      <Form.Item label="账号" required>
        <Input
          v-model:value="form.AccountNum"
          allow-clear
          placeholder="支付宝账号"
        />
      </Form.Item>
      <Form.Item v-if="form.HandleType === 1" label="支付宝应用 ID" required>
        <Input
          v-model:value="form.AlipayAppId"
          allow-clear
          placeholder="请输入 AppId"
        />
      </Form.Item>
      <Form.Item v-if="form.HandleType === 1" label="支付宝公钥" required>
        <Input.TextArea
          v-model:value="form.AlipayPubKey"
          :rows="4"
          placeholder="请输入支付宝公钥"
        />
      </Form.Item>
      <Form.Item v-if="form.HandleType === 1" label="支付宝私钥" required>
        <Input.TextArea
          v-model:value="form.AlipayPriKey"
          :rows="4"
          placeholder="请输入支付宝私钥"
        />
      </Form.Item>
      <Form.Item v-if="form.HandleType === 2" label="账户姓名" required>
        <Input
          v-model:value="form.RealName"
          allow-clear
          placeholder="真实姓名"
        />
      </Form.Item>
      <Form.Item label="常用地址" required>
        <Select
          v-model:value="form.UsualAddr"
          :options="PROVINCE_OPTIONS"
          allow-clear
          show-search
          placeholder="选择省份"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="每日最小限额" required>
        <InputNumber
          v-model:value="form.MinMoney"
          :min="1"
          :precision="0"
          class="w-full"
          placeholder="元"
        />
      </Form.Item>
      <Form.Item label="每日最大限额" required>
        <InputNumber
          v-model:value="form.MaxMoney"
          :min="1"
          :precision="0"
          class="w-full"
          placeholder="元"
        />
      </Form.Item>
      <Form.Item label="单笔最小限额">
        <InputNumber
          v-model:value="form.MinOrderMoney"
          :min="1"
          :precision="0"
          class="w-full"
          placeholder="元"
        />
      </Form.Item>
      <Form.Item label="单笔最大限额">
        <InputNumber
          v-model:value="form.MaxOrderMoney"
          :min="1"
          :precision="0"
          class="w-full"
          placeholder="元"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
