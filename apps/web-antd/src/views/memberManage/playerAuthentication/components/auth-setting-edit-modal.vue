<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import type {
  PlayerAuthSettingConfig,
  PlayerAuthSettingItem,
} from '#/types/player-authentication';

import { computed, ref, watch } from 'vue';

import { Button, Checkbox, Form, message, Modal, Upload } from 'ant-design-vue';

import { updatePlayerAuthImageApi } from '#/api/memberManage/player-authentication';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'AuthSettingEditModal' });

const props = defineProps<{
  open: boolean;
  row: null | PlayerAuthSettingItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const exInfo = ref<string[]>(['', '', '', '']);
const enableEvent = ref('');

const imageLabels = [
  'APP/H5 身份照片示意图',
  'PC 身份照片示意图',
  'APP/H5 验证照片示意图',
  'PC 验证照片示意图',
];

const isActivitySubtype = computed(() => props.row?.SubType === 4);

const enabledActivityTypes = computed({
  get: () =>
    enableEvent.value
      ? enableEvent.value
          .split(',')
          .map((x) => Number.parseInt(x, 10))
          .filter(Boolean)
      : [],
  set: (val: Array<number | string>) => {
    enableEvent.value = val.map(String).join(',');
  },
});

function resolveConfig(config?: PlayerAuthSettingItem['Config']) {
  if (!config) {
    return {} as PlayerAuthSettingConfig;
  }
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as PlayerAuthSettingConfig;
    } catch {
      return {} as PlayerAuthSettingConfig;
    }
  }
  return config;
}

watch(
  () => props.open,
  (open) => {
    if (!open || !props.row) {
      return;
    }
    const config = resolveConfig(props.row.Config);
    const current = config.ExInfo || [];
    const exInfoList = Array.isArray(current)
      ? current
      : String(current).split(',');
    exInfo.value = [
      exInfoList[0] || '',
      exInfoList[1] || '',
      exInfoList[2] || '',
      exInfoList[3] || '',
    ];
    enableEvent.value = config.Events || '';
  },
);

function closeModal() {
  emit('update:open', false);
}

function beforeUpload(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['jpeg', 'jpg', 'png'].includes(ext)) {
    message.warning('仅支持 JPG/PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size > 500 * 1024) {
    message.warning('图片大小不能超过 500KB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleUploadChange(index: number, info: UploadChangeParam) {
  const response = info.file.response as
    | undefined
    | { Code?: number | string; Data?: { url?: string }; Msg?: string };
  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      exInfo.value[index] = response.Data.url;
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

async function handleSubmit() {
  if (!props.row) {
    return;
  }
  submitting.value = true;
  try {
    await updatePlayerAuthImageApi({
      ExInfo: exInfo.value.join(','),
      SubType: props.row.SubType,
      ...(enableEvent.value ? { EnableEvent: enableEvent.value } : {}),
    });
    message.success('保存成功');
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
    :open="open"
    title="编辑验证设置"
    width="720px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item
        v-for="(label, index) in imageLabels"
        :key="label"
        :label="label"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="exInfo[index]"
            alt=""
            class="h-16 w-24 rounded border object-cover"
            :src="getServiceImageUrl(exInfo[index])"
          />
          <Upload
            :action="getUploadMd5ImageUrl()"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            @change="(info) => handleUploadChange(index, info)"
          >
            <Button size="small">
{{
              exInfo[index] ? '重新上传' : '上传'
            }}
</Button>
          </Upload>
          <Button
            v-if="exInfo[index]"
            danger
            size="small"
            @click="exInfo[index] = ''"
          >
            删除
          </Button>
        </div>
      </Form.Item>
      <Form.Item v-if="isActivitySubtype" label="关联活动">
        <Checkbox.Group v-model:value="enabledActivityTypes">
          <Checkbox :value="10009">新手任务</Checkbox>
        </Checkbox.Group>
      </Form.Item>
    </Form>
  </Modal>
</template>
