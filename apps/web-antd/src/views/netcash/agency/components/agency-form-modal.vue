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
} from 'ant-design-vue';

import { createAgencyApi, updateAgencyApi } from '#/api/netcash/agency';

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

const title = computed(() =>
  props.mode === 'create' ? '新增代理' : '编辑代理',
);

const form = reactive({
  AccountType: 1 as number,
  CommissionTemplateId: undefined as number | undefined,
  ConfirmPassword: '',
  DeveloperName: '',
  Name: '',
  Password: '',
  Remark: '',
  Username: '',
});

function resetForm() {
  form.Username = '';
  form.Password = '';
  form.ConfirmPassword = '';
  form.Name = '';
  form.DeveloperName = '';
  form.AccountType = 1;
  form.CommissionTemplateId = undefined;
  form.Remark = '';
}

function fillFromRow(row: AgencyListItem) {
  resetForm();
  form.Username = String(row.Username || '');
  form.Name = String(row.Name || '');
  form.DeveloperName = String(row.DeveloperName || '');
  form.AccountType = Number(row.AccountType) || 1;
  form.CommissionTemplateId = row.CommissionTemplateId as number | undefined;
  form.Remark = String(row.Remark || '');
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
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
    message.warning('请输入佣金方案模板 ID');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validate()) {
    return;
  }
  submitting.value = true;
  try {
    if (props.mode === 'create') {
      await createAgencyApi({
        AccountType: form.AccountType,
        CommissionTemplateId:
          form.AccountType === 1 ? form.CommissionTemplateId : undefined,
        DeveloperName: form.DeveloperName,
        Name: form.Name,
        Password: form.Password,
        Remark: form.Remark,
        Username: form.Username,
      });
      message.success('新增成功');
    } else {
      await updateAgencyApi({
        AccountType: form.AccountType,
        CommissionTemplateId:
          form.AccountType === 1 ? form.CommissionTemplateId : undefined,
        DeveloperName: form.DeveloperName,
        Id: props.row?.Id,
        Name: form.Name,
        Remark: form.Remark,
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
    width="560px"
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
      <Form.Item label="发展人">
        <Input v-model:value="form.DeveloperName" placeholder="请输入发展人" />
      </Form.Item>
      <Form.Item label="代理模式" required>
        <Radio.Group v-model:value="form.AccountType">
          <Radio :value="1">单层</Radio>
          <Radio :value="2">无限级</Radio>
          <Radio :value="3">返点</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item v-if="form.AccountType === 1" label="佣金方案模板 ID" required>
        <InputNumber
          v-model:value="form.CommissionTemplateId"
          :min="1"
          placeholder="请输入佣金方案模板 ID"
          style="width: 100%"
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
