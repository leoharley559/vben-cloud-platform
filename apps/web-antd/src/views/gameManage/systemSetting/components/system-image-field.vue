<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed } from 'vue';

import { Button, Image, message, Upload } from 'ant-design-vue';

import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'SystemImageField' });

const props = withDefaults(
  defineProps<{
    action?: string;
    expectedHeight?: number;
    expectedWidth?: number;
    hint?: string;
    maxSizeKb?: number;
  }>(),
  {
    action: '',
    expectedHeight: 0,
    expectedWidth: 0,
    hint: '',
    maxSizeKb: 500,
  },
);
const modelValue = defineModel<string>({ default: '' });
const previewUrl = computed(() => getServiceImageUrl(modelValue.value));
const uploadAction = computed(
  () => props.action || getUploadMd5ImageUrl(),
);

function beforeUpload(file: File) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    message.warning('仅支持 JPG、JPEG、PNG 格式');
    return Upload.LIST_IGNORE;
  }
  if (file.size >= props.maxSizeKb * 1024) {
    message.warning(`图片大小必须小于 ${props.maxSizeKb}KB`);
    return Upload.LIST_IGNORE;
  }
  if (!props.expectedWidth || !props.expectedHeight) return true;
  return new Promise<boolean | typeof Upload.LIST_IGNORE>((resolve) => {
    const image = document.createElement('img');
    const url = URL.createObjectURL(file);
    image.addEventListener('load', () => {
      URL.revokeObjectURL(url);
      if (
        image.width !== props.expectedWidth ||
        image.height !== props.expectedHeight
      ) {
        message.warning(
          `图片尺寸必须为 ${props.expectedWidth}×${props.expectedHeight}`,
        );
        resolve(Upload.LIST_IGNORE);
      } else {
        resolve(true);
      }
    });
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      message.error('无法读取图片');
      resolve(Upload.LIST_IGNORE);
    });
    image.src = url;
  });
}

function handleChange(info: UploadChangeParam) {
  if (info.file.status === 'done') {
    const response = info.file.response as
      | undefined
      | { Code?: number | string; Data?: { url?: string }; Msg?: string };
    if (String(response?.Code ?? '') === '200' && response?.Data?.url) {
      modelValue.value = response.Data.url;
    } else {
      message.error(response?.Msg || '图片上传失败');
    }
  } else if (info.file.status === 'error') {
    message.error('图片上传失败');
  }
}
</script>

<template>
  <div class="image-field">
    <div class="preview">
      <Image
        v-if="modelValue"
        :height="76"
        :src="previewUrl"
        :width="110"
        style="object-fit: contain"
      />
      <span v-else>暂无图片</span>
    </div>
    <div class="actions">
      <Upload
        :action="uploadAction"
        :before-upload="beforeUpload"
        :show-upload-list="false"
        accept=".jpg,.jpeg,.png"
        name="upfile"
        @change="handleChange"
      >
        <Button size="small">{{ modelValue ? '重新上传' : '上传图片' }}</Button>
      </Upload>
      <Button
        v-if="modelValue"
        danger
        size="small"
        @click="modelValue = ''"
      >
        删除
      </Button>
      <small>{{ hint }}</small>
    </div>
  </div>
</template>

<style scoped>
.image-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112px;
  height: 78px;
  overflow: hidden;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 35%);
  border: 1px dashed hsl(var(--border));
  border-radius: 6px;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.actions small {
  color: hsl(var(--muted-foreground));
}
</style>
