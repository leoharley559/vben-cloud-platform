<script lang="ts" setup>
import type { AdminDialogMode, AdminFormModel } from '#/types/system-manage';

import { computed, reactive, ref } from 'vue';

import { Form, Input, Modal, Select, Spin } from 'ant-design-vue';

import { fetchAdminDetailApi } from '#/api/systemManage/admin';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  createDefaultAdminForm,
  isValidPassword,
  isValidRemark,
  isValidUsername,
  parseAdminDetail,
} from '#/views/systemManage/adminManage/utils/admin-form';

import { useAdminProjectOptions } from '../composables/use-admin-project-options';

defineOptions({ name: 'AdminFormModal' });

const emit = defineEmits<{
  submit: [payload: { form: AdminFormModel; mode: AdminDialogMode }];
}>();

const visible = ref(false);
const loading = ref(false);
const mode = ref<AdminDialogMode>('create');
const formModel = reactive<AdminFormModel>(createDefaultAdminForm());

const { adminInfo } = useCloudPermission();
const { deviceOptions, packageOptions } = useAdminProjectOptions();

const roleOptions = computed(() => {
  const list = adminInfo.value?.CRole;
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map((item) => ({
    label: item.Name,
    value: item.Id,
  }));
});

const modalTitle = computed(() => {
  switch (mode.value) {
    case 'create': {
      return '新建账号';
    }
    case 'endUse': {
      return '停用账号';
    }
    case 'startUse': {
      return '启用账号';
    }
    default: {
      return '编辑账号';
    }
  }
});

const isCreate = computed(() => mode.value === 'create');
const isStatusMode = computed(
  () => mode.value === 'startUse' || mode.value === 'endUse',
);

function resetFormModel() {
  Object.assign(formModel, createDefaultAdminForm());
}

async function loadDetail(id: number) {
  loading.value = true;
  try {
    const detail = await fetchAdminDetailApi(id);
    const parsed = parseAdminDetail(detail as unknown as AdminFormModel);
    Object.assign(formModel, parsed, {
      ConfirmPassword: '',
      Password: '',
    });
  } finally {
    loading.value = false;
  }
}

async function open(nextMode: AdminDialogMode, id?: number, status?: number) {
  mode.value = nextMode;
  visible.value = true;
  resetFormModel();

  if (nextMode === 'create') {
    return;
  }

  if (id) {
    await loadDetail(id);
    if (status !== undefined) {
      formModel.Status = status;
    }
  }
}

function close() {
  visible.value = false;
  resetFormModel();
}

function validateForm() {
  if (isCreate.value) {
    if (!formModel.Username) {
      throw new Error('请输入登录账号');
    }
    if (!isValidUsername(formModel.Username)) {
      throw new Error('账号需以字母开头，6-20位字母数字下划线');
    }
    if (!formModel.Password) {
      throw new Error('请输入密码');
    }
  }

  if (
    !isStatusMode.value &&
    formModel.Password &&
    !isValidPassword(formModel.Password)
  ) {
    throw new Error('密码为6-20位字母数字下划线');
  }

  if (
    !isStatusMode.value &&
    formModel.Password &&
    formModel.Password !== formModel.ConfirmPassword
  ) {
    throw new Error('两次输入的密码不一致');
  }

  if (!isStatusMode.value && !formModel.Role?.length) {
    throw new Error('请选择账号角色');
  }

  if (
    !isStatusMode.value &&
    !formModel.SonUserRoleDataField?.SeePackageId?.length
  ) {
    throw new Error('请选择产品权限');
  }

  if (!isValidRemark(formModel.Note)) {
    throw new Error('备注长度不能超过400字符');
  }
}

async function handleConfirm() {
  try {
    validateForm();
    emit('submit', {
      form: JSON.parse(JSON.stringify(formModel)) as AdminFormModel,
      mode: mode.value,
    });
  } catch (error) {
    Modal.error({
      content: error instanceof Error ? error.message : '表单校验失败',
      title: '提示',
    });
  }
}

defineExpose({
  close,
  open,
});
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="visible"
    :title="modalTitle"
    destroy-on-close
    ok-text="确认"
    cancel-text="取消"
    width="720px"
    @cancel="close"
    @ok="handleConfirm"
  >
    <Spin :spinning="loading">
      <Form layout="vertical">
        <Form.Item v-if="isCreate" label="登录账号" required>
          <Input
            v-model:value="formModel.Username"
            :maxlength="20"
            placeholder="请输入登录账号"
          />
        </Form.Item>

        <template v-if="!isStatusMode">
          <Form.Item :required="isCreate" label="登录密码">
            <Input.Password
              v-model:value="formModel.Password"
              :maxlength="20"
              :placeholder="isCreate ? '请输入密码' : '不修改请留空'"
            />
          </Form.Item>
          <Form.Item label="确认密码">
            <Input.Password
              v-model:value="formModel.ConfirmPassword"
              :maxlength="20"
              placeholder="请再次输入密码"
            />
          </Form.Item>
        </template>

        <Form.Item label="昵称">
          <Input
            v-model:value="formModel.Name"
            :disabled="isStatusMode"
            :maxlength="50"
            placeholder="请输入昵称"
          />
        </Form.Item>
        <Form.Item label="联系方式">
          <Input
            v-model:value="formModel.ContactInf"
            :disabled="isStatusMode"
            :maxlength="50"
            placeholder="请输入联系方式"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input
            v-model:value="formModel.Note"
            :maxlength="400"
            placeholder="请输入备注"
          />
        </Form.Item>

        <template v-if="!isStatusMode">
          <Form.Item label="短信验证码权限" required>
            <Select
              v-model:value="formModel.SonUserRoleDataField.ViewOTP"
              :options="[
                { label: '允许全部玩家短信验证', value: '1' },
                { label: '仅白名单玩家短信验证', value: '2' },
              ]"
              placeholder="请选择"
            />
          </Form.Item>
          <Form.Item label="账号角色" required>
            <Select
              v-model:value="formModel.Role"
              :options="roleOptions"
              mode="multiple"
              placeholder="请选择角色"
            />
          </Form.Item>
          <Form.Item label="可创建角色">
            <Select
              v-model:value="formModel.CreateRole"
              :options="roleOptions"
              mode="multiple"
              placeholder="请选择可创建角色"
            />
          </Form.Item>
          <Form.Item label="产品权限" required>
            <Select
              v-model:value="formModel.SonUserRoleDataField.SeePackageId"
              :options="
                packageOptions.map((item) => ({
                  label: item.PackageName,
                  value: item.PackageId,
                }))
              "
              mode="multiple"
              placeholder="请选择产品权限"
            />
          </Form.Item>
          <Form.Item label="渠道权限">
            <ChannelSelect
              v-model="formModel.SonUserRoleDataField.SeeChannelId"
            />
          </Form.Item>
          <Form.Item label="账号权限">
            <AccountSelect
              v-model="formModel.SonUserRoleDataField.SeeAccountId"
            />
          </Form.Item>
          <Form.Item label="日报设备权限">
            <Select
              v-model:value="formModel.SonUserRoleDataField.SeeDevices"
              :options="deviceOptions"
              mode="multiple"
              placeholder="请选择日报设备权限"
            />
          </Form.Item>
        </template>
      </Form>
    </Spin>
  </Modal>
</template>
