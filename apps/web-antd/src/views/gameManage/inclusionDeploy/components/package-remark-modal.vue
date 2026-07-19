<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { PackageId } from '#/types/package-config';

import { nextTick, reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import {
  fetchPackageDetailApi,
  updatePackageDescriptionApi,
} from '#/api/gameManage/package';

const props = defineProps<{
  open: boolean;
  packageId?: PackageId;
  packageName?: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const form = reactive({ Description: '' });

function validateDescription(_rule: unknown, value: string) {
  return !value || value.trim()
    ? Promise.resolve()
    : Promise.reject(new Error('备注不能只包含空格'));
}

function close() {
  emit('update:open', false);
}

async function loadDetail() {
  if (!props.packageId) {
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchPackageDetailApi(props.packageId);
    form.Description = detail.Description || '';
    await nextTick();
    formRef.value?.clearValidate();
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!props.packageId) {
    return;
  }
  await formRef.value?.validate();
  submitting.value = true;
  try {
    await updatePackageDescriptionApi({
      Description: form.Description.trim(),
      Id: props.packageId,
    });
    message.success('备注保存成功');
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadDetail();
    }
  },
);
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="`编辑备注${packageName ? ` · ${packageName}` : ''}`"
    @cancel="close"
    @ok="submit"
  >
    <Form ref="formRef" :model="form" layout="vertical">
      <Form.Item
        label="产品备注"
        name="Description"
        :rules="[
          { max: 500, message: '备注不能超过 500 个字符' },
          { validator: validateDescription },
        ]"
      >
        <Input.TextArea
          v-model:value="form.Description"
          :disabled="loading"
          :maxlength="500"
          :rows="5"
          show-count
          placeholder="请输入产品备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
