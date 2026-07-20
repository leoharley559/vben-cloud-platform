<script lang="ts" setup>
import type { AgencyListItem } from '#/types/netcash';

import { computed, reactive, ref, watch } from 'vue';

import {
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
} from 'ant-design-vue';

import {
  createAgencyApi,
  fetchDeveloperNamesListApi,
  updateAgencyApi,
} from '#/api/netcash/agency';
import {
  fetchCommTempListApi,
  fetchMultCommTempListApi,
  fetchVenueTemplateListApi,
} from '#/api/netcash/commission-manage';
import { fetchJuniorAlgorithmOptionsApi } from '#/api/netcash/junior-member';

defineOptions({ name: 'AgencyFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row?: AgencyListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const optionsLoading = ref(false);
const developerOptions = ref<
  Array<{ developerName: string; label: string; value: number | string }>
>([]);
const commissionOptions = ref<
  Array<{ label: string; value: number | string }>
>([]);
const multCommissionOptions = ref<
  Array<{ label: string; value: number | string }>
>([]);
const venueOptions = ref<Array<{ label: string; value: number | string }>>([]);
const algorithmOptions = ref<
  Array<{ label: string; value: number | string }>
>([]);

const title = computed(() =>
  props.mode === 'create' ? '新增代理' : '编辑代理',
);

const form = reactive({
  AccountType: 1 as number,
  AlgorithmTemplateId: undefined as number | string | undefined,
  ApiFeeTemplateId: undefined as number | string | undefined,
  CommissionMultiTemplateId: undefined as number | string | undefined,
  CommissionRate: undefined as number | undefined,
  CommissionRateDiff: undefined as number | undefined,
  CommissionTemplateId: undefined as number | undefined,
  ConfirmPassword: '',
  DeveloperName: '',
  DeveloperId: undefined as number | string | undefined,
  MaintainerName: '',
  MobileNumber: '',
  Name: '',
  Password: '',
  Remark: '',
  SendCommissionType: 1,
  SettlementType: 1,
  Type: 1,
  Username: '',
});

function resetForm() {
  form.Username = '';
  form.Password = '';
  form.ConfirmPassword = '';
  form.Name = '';
  form.DeveloperName = '';
  form.DeveloperId = undefined;
  form.MaintainerName = '';
  form.MobileNumber = '';
  form.AccountType = 1;
  form.CommissionTemplateId = undefined;
  form.CommissionMultiTemplateId = undefined;
  form.CommissionRate = undefined;
  form.CommissionRateDiff = undefined;
  form.ApiFeeTemplateId = undefined;
  form.AlgorithmTemplateId = undefined;
  form.Type = 1;
  form.SettlementType = 1;
  form.SendCommissionType = 1;
  form.Remark = '';
}

function fillFromRow(row: AgencyListItem) {
  resetForm();
  form.Username = String(row.Username || '');
  form.Name = String(row.Name || '');
  form.DeveloperName = String(row.DeveloperName || '');
  form.DeveloperId = row.DeveloperId as number | string | undefined;
  form.MaintainerName = String(row.MaintainerName || '');
  form.MobileNumber = String(row.MobileNumber || '');
  form.AccountType = Number(row.AccountType) || 1;
  form.CommissionTemplateId = row.CommissionTemplateId as number | undefined;
  form.CommissionMultiTemplateId = row.CommissionMultiTemplateId as
    | number
    | string
    | undefined;
  form.CommissionRate =
    row.CommissionRate === undefined ? undefined : Number(row.CommissionRate) / 100;
  form.CommissionRateDiff =
    row.CommissionRateDiff === undefined
      ? undefined
      : Number(row.CommissionRateDiff) / 100;
  form.ApiFeeTemplateId = row.ApiFeeTemplateId as
    | number
    | string
    | undefined;
  form.AlgorithmTemplateId = row.AlgorithmTemplateId as
    | number
    | string
    | undefined;
  form.Remark = String(row.Remark || '');
  form.Type = Number(row.Type) || 1;
  form.SettlementType = Number(row.SettlementType) || 1;
  form.SendCommissionType = Number(row.SendCommissionType) || 1;
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const [developers, commissions, multCommissions, venues, algorithms] =
      await Promise.all([
      fetchDeveloperNamesListApi({ Page: 1, PageSize: 9999 }),
      fetchCommTempListApi({ Page: 1, PageSize: 9999 }),
      fetchMultCommTempListApi({ Page: 1, PageSize: 9999 }),
      fetchVenueTemplateListApi({ Page: 1, PageSize: 9999 }),
      fetchJuniorAlgorithmOptionsApi(),
    ]);
    developerOptions.value = (developers?.Items || []).map((item) => ({
      developerName: String(item.DeveloperName || ''),
      label: `${item.DeveloperName || '-'}${item.Remark ? `（${item.Remark}）` : ''}`,
      value: item.Id as number | string,
    }));
    commissionOptions.value = (commissions?.Items || []).map((item) => ({
      label: String(item.Name || item.TemplateName || item.Id || ''),
      value: item.Id as number | string,
    }));
    multCommissionOptions.value = (multCommissions?.Items || []).map((item) => ({
      label: String(item.TemplateName || item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
    venueOptions.value = (venues?.Items || []).map((item) => ({
      label: String(item.TemplateName || item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
    algorithmOptions.value = (algorithms || []).map((item) => ({
      label: String(item.TemplateName || item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
  } finally {
    optionsLoading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    loadOptions();
    if (props.mode === 'edit' && props.row) {
      fillFromRow(props.row);
      return;
    }
    resetForm();
  },
);

function closeModal() {
  emit('update:open', false);
}

function validate() {
  if (!form.Username.trim()) {
    message.warning('请输入代理账号');
    return false;
  }
  if (props.mode === 'create') {
    if (!form.Password) {
      message.warning('请输入密码');
      return false;
    }
    if (form.Password !== form.ConfirmPassword) {
      message.warning('两次输入的密码不一致');
      return false;
    }
  }
  if (!form.Name.trim()) {
    message.warning('请输入姓名');
    return false;
  }
  if (form.AccountType === 1 && !form.CommissionTemplateId) {
    message.warning('请选择单层佣金模板');
    return false;
  }
  if (form.AccountType === 2 && !validPercent(form.CommissionRate, true)) {
    message.warning('佣金比例须为 0-100，最多两位小数');
    return false;
  }
  if (form.AccountType === 3 && !form.CommissionMultiTemplateId) {
    message.warning('请选择多层多费率佣金模板');
    return false;
  }
  if (
    form.AccountType !== 1 &&
    !validPercent(form.CommissionRateDiff, false)
  ) {
    message.warning('佣金级距须大于 0 且不超过 100，最多两位小数');
    return false;
  }
  if (!form.ApiFeeTemplateId || !form.AlgorithmTemplateId) {
    message.warning('请选择场馆费率与佣金算法');
    return false;
  }
  return true;
}

function validPercent(value: number | undefined, allowZero: boolean) {
  if (value === undefined || Number.isNaN(Number(value))) return false;
  const number = Number(value);
  return number <= 100 && (allowZero ? number >= 0 : number > 0);
}

function selectDeveloper(value: number | string) {
  form.DeveloperName =
    developerOptions.value.find((item) => String(item.value) === String(value))
      ?.developerName || '';
}

function buildPayload() {
  return {
    AccountType: form.AccountType,
    AlgorithmTemplateId: form.AlgorithmTemplateId,
    ApiFeeTemplateId: form.ApiFeeTemplateId,
    CommissionMultiTemplateId:
      form.AccountType === 3 ? form.CommissionMultiTemplateId : undefined,
    CommissionRate:
      form.AccountType === 2
        ? Math.round(Number(form.CommissionRate) * 100)
        : undefined,
    CommissionRateDiff:
      form.AccountType === 1
        ? 0
        : Math.round(Number(form.CommissionRateDiff) * 100),
    CommissionTemplateId:
      form.AccountType === 1 ? form.CommissionTemplateId : undefined,
    DeveloperId: form.DeveloperId,
    DeveloperName: form.DeveloperName,
    MaintainerName: form.MaintainerName,
    MobileNumber: form.MobileNumber,
    Name: form.Name,
    Remark: form.Remark,
    SendCommissionType: form.SendCommissionType,
    SettlementType: form.SettlementType,
    Type: form.Type,
    Username: form.Username,
  };
}

async function handleSubmit() {
  if (!validate()) {
    return;
  }
  submitting.value = true;
  try {
    if (props.mode === 'create') {
      await createAgencyApi({
        ...buildPayload(),
        DeviceId: crypto.randomUUID(),
        Password: form.Password,
      });
      message.success('新增成功');
    } else {
      await updateAgencyApi({
        ...buildPayload(),
        AdminId: props.row?.AdminId ?? props.row?.Id,
        Id: props.row?.Id,
      });
      message.success('编辑成功');
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
    :confirm-loading="submitting"
    destroy-on-close
    :open="open"
    :title="title"
    width="720px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="代理账号" required>
        <Input
          v-model:value="form.Username"
          :disabled="mode === 'edit'"
          placeholder="请输入代理账号"
        />
      </Form.Item>
      <template v-if="mode === 'create'">
        <Form.Item label="密码" required>
          <Input.Password
            v-model:value="form.Password"
            placeholder="请输入密码"
          />
        </Form.Item>
        <Form.Item label="确认密码" required>
          <Input.Password
            v-model:value="form.ConfirmPassword"
            placeholder="请再次输入密码"
          />
        </Form.Item>
      </template>
      <Form.Item label="姓名" required>
        <Input v-model:value="form.Name" placeholder="请输入姓名" />
      </Form.Item>
      <Form.Item label="手机号">
        <Input v-model:value="form.MobileNumber" placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item label="代理类型" required>
        <Select
          v-model:value="form.Type"
          :options="[
            { label: '普通代理', value: 1 },
            { label: '特殊代理', value: 2 },
          ]"
        />
      </Form.Item>
      <Form.Item label="发展人">
        <Select
          v-model:value="form.DeveloperId"
          allow-clear
          :loading="optionsLoading"
          :options="developerOptions"
          placeholder="请选择发展人"
          show-search
          @change="(value) => selectDeveloper(value as number | string)"
        />
      </Form.Item>
      <Form.Item label="维护人">
        <Input v-model:value="form.MaintainerName" placeholder="请输入维护人" />
      </Form.Item>
      <Form.Item label="代理模式" required>
        <Radio.Group v-model:value="form.AccountType">
          <Radio :value="1">单层</Radio>
          <Radio :value="2">多层（单费率）</Radio>
          <Radio :value="3">多层（多费率）</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="场馆费率" required>
        <Select
          v-model:value="form.ApiFeeTemplateId"
          :loading="optionsLoading"
          :options="venueOptions"
          placeholder="请选择场馆费率模板"
          show-search
        />
      </Form.Item>
      <Form.Item v-if="form.AccountType === 1" label="佣金方案" required>
        <Select
          v-model:value="form.CommissionTemplateId"
          :loading="optionsLoading"
          :options="commissionOptions"
          placeholder="请选择佣金方案"
          show-search
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item
        v-if="form.AccountType === 2"
        label="佣金比例"
        required
      >
        <InputNumber
          v-model:value="form.CommissionRate"
          :max="100"
          :min="0"
          :precision="2"
          style="width: 100%"
          addon-after="%"
        />
      </Form.Item>
      <Form.Item
        v-if="form.AccountType === 3"
        label="多层多费率佣金模板"
        required
      >
        <Select
          v-model:value="form.CommissionMultiTemplateId"
          :loading="optionsLoading"
          :options="multCommissionOptions"
          placeholder="请选择多层多费率佣金模板"
          show-search
        />
      </Form.Item>
      <Form.Item v-if="form.AccountType !== 1" label="佣金级距" required>
        <InputNumber
          v-model:value="form.CommissionRateDiff"
          :max="100"
          :min="0.01"
          :precision="2"
          style="width: 100%"
          addon-after="%"
        />
      </Form.Item>
      <Form.Item label="佣金算法" required>
        <Select
          v-model:value="form.AlgorithmTemplateId"
          :loading="optionsLoading"
          :options="algorithmOptions"
          placeholder="请选择佣金算法"
          show-search
        />
      </Form.Item>
      <Form.Item label="佣金周期" required>
        <Select
          v-model:value="form.SettlementType"
          :options="[
            { label: '日结', value: 1 },
            { label: '周结', value: 2 },
            { label: '月结', value: 3 },
          ]"
        />
      </Form.Item>
      <Form.Item label="发佣方式" required>
        <Select
          v-model:value="form.SendCommissionType"
          :options="[
            { label: '系统发放一级代理', value: 1 },
            { label: '系统发放全部代理', value: 2 },
          ]"
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="form.Remark"
          placeholder="请输入备注"
          :rows="3"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
