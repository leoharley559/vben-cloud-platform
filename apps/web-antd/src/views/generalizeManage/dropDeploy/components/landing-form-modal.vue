<script lang="ts" setup>
import type { LandingPageItem, LandingResourceItem } from '#/types/promotion';

import { ref, watch } from 'vue';

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
  createLandingDeployApi,
  fetchLandingDeployDetailApi,
  updateLandingDeployApi,
} from '#/api/promotion/landing-deploy';

const props = defineProps<{
  editId?: number | string;
  open: boolean;
  resourceList: LandingResourceItem[];
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const saving = ref(false);
const formName = ref('');
const formDescription = ref('');
const formDownloadMode = ref(2);
const formDownloadTime = ref<number>();
const formBackground = ref('');
const formBackgroundStyle = ref<number | string>('');

const styleOptions = [
  { label: '样式一', value: 1 },
  { label: '样式二', value: 2 },
  { label: '样式三', value: 3 },
];

function resetForm() {
  formName.value = '';
  formDescription.value = '';
  formDownloadMode.value = 2;
  formDownloadTime.value = undefined;
  formBackground.value = '';
  formBackgroundStyle.value = '';
}

async function loadDetail() {
  if (!props.editId) {
    resetForm();
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchLandingDeployDetailApi(props.editId);
    formName.value = detail.Name || '';
    formDescription.value = detail.Description || '';
    formDownloadMode.value = detail.DownloadMode || 2;
    formDownloadTime.value = Number(detail.DownloadTime || 0) || undefined;
    formBackground.value = detail.Background || '';
    formBackgroundStyle.value = detail.BackgroundStyle || '';
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
  resetForm();
}

async function handleSubmit() {
  if (!formName.value.trim()) {
    message.warning('请输入模板名称');
    return;
  }
  if (!formBackground.value) {
    message.warning('请选择页面风格');
    return;
  }
  saving.value = true;
  try {
    const payload: LandingPageItem = {
      Background: formBackground.value,
      BackgroundStyle: formBackgroundStyle.value,
      Description: formDescription.value,
      DownloadMode: formDownloadMode.value,
      DownloadTime: formDownloadTime.value,
      Id: props.editId,
      Name: formName.value,
    };
    if (props.editId) {
      await updateLandingDeployApi(payload);
      message.success('编辑成功');
    } else {
      await createLandingDeployApi(payload);
      message.success('创建成功');
    }
    emit('success');
    handleClose();
  } finally {
    saving.value = false;
  }
}

watch(
  () => [props.open, props.editId] as const,
  ([open]) => {
    if (open) {
      loadDetail();
    }
  },
);
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    :title="editId ? '编辑落地页' : '新增落地页'"
    width="640px"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="模板名称" required>
        <Input v-model:value="formName" />
      </Form.Item>
      <Form.Item label="页面风格类型">
        <Select
          v-model:value="formBackgroundStyle"
          :options="styleOptions"
          placeholder="请选择类型"
        />
      </Form.Item>
      <Form.Item label="页面风格" required>
        <Select
          v-model:value="formBackground"
          :options="
            resourceList.map((item) => ({
              label: item.PictureUrl || String(item.Id),
              value: item.PictureUrl || item.Id,
            }))
          "
          placeholder="请选择背景图"
        />
      </Form.Item>
      <Form.Item label="下载方式">
        <Radio.Group v-model:value="formDownloadMode">
          <Radio :value="1">自动下载</Radio>
          <Radio :value="2">手动下载</Radio>
          <Radio :value="3">延时下载</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item v-if="formDownloadMode === 3" label="延时秒数">
        <InputNumber v-model:value="formDownloadTime" :min="1" class="w-full" />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea v-model:value="formDescription" :rows="3" />
      </Form.Item>
    </Form>
  </Modal>
</template>
