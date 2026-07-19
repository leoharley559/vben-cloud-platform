<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed } from 'vue';

import { Button, Upload, message } from 'ant-design-vue';

import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'VoucherImageField' });

const props = withDefaults(
  defineProps<{
    dimensionHint?: string;
    disabled?: boolean;
    maxSizeKb?: number;
    previewHeight?: number;
    previewWidth?: number;
  }>(),
  {
    dimensionHint: '',
    disabled: false,
    maxSizeKb: 500,
    previewHeight: 56,
    previewWidth: 84,
  },
);

const modelValue = defineModel<string>({ default: '' });

const previewUrl = computed(() => getServiceImageUrl(modelValue.value));

function beforeUpload(file: File) {
  if (props.maxSizeKb && file.size > props.maxSizeKb * 1024) {
    message.warning(`图片大小不能超过 ${props.maxSizeKb}K`);
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleChange(info: UploadChangeParam) {
  if (info.file.status === 'uploading') {
    return;
  }
  if (info.file.status === 'done') {
    const response = info.file.response as
      | { Code?: number | string; Data?: { url?: string }; Msg?: string }
      | undefined;
    if (String(response?.Code ?? '') === '200' && response?.Data?.url) {
      modelValue.value = response.Data.url;
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  } else if (info.file.status === 'error') {
    message.error('图片上传失败');
  }
}

function handleRemove() {
  modelValue.value = '';
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="flex shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50"
      :style="{ height: `${previewHeight}px`, width: `${previewWidth}px` }"
    >
      <img
        v-if="modelValue"
        alt="预览"
        class="h-full w-full object-contain"
        :src="previewUrl"
      />
      <span v-else class="px-1 text-center text-xs text-gray-400">无图片</span>
    </div>
    <div class="flex flex-col items-start gap-1">
      <Upload
        :action="getUploadMd5ImageUrl()"
        :before-upload="beforeUpload"
        :disabled="disabled"
        :show-upload-list="false"
        accept="image/*"
        @change="handleChange"
      >
        <Button :disabled="disabled" size="small">
          {{ modelValue ? '重新上传' : '上传图片' }}
        </Button>
      </Upload>
      <Button
        v-if="modelValue"
        danger
        :disabled="disabled"
        size="small"
        @click="handleRemove"
      >
        删除
      </Button>
      <div v-if="dimensionHint" class="text-xs text-gray-400">
        {{ dimensionHint }}
      </div>
    </div>
  </div>
</template>
