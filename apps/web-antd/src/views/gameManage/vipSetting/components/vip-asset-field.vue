<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed } from 'vue';

import { Button, message, Upload } from 'ant-design-vue';

import {
  getServiceImageUrl,
  getUploadFileUrl,
  getUploadMd5ImageUrl,
} from '#/utils/media';

defineOptions({ name: 'VipAssetField' });

const props = withDefaults(
  defineProps<{
    accept?: string;
    hint?: string;
    image?: boolean;
  }>(),
  {
    accept: '.jpg,.jpeg,.png',
    hint: '',
    image: true,
  },
);
const modelValue = defineModel<string>({ default: '' });
const previewUrl = computed(() => getServiceImageUrl(modelValue.value));
const uploadUrl = computed(() =>
  props.image ? getUploadMd5ImageUrl() : getUploadFileUrl(),
);

function beforeUpload(file: File) {
  if (file.size >= 500 * 1024) {
    message.warning('文件大小不能超过 500KB');
    return Upload.LIST_IGNORE;
  }
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const allowed = props.accept.split(',').map((item) => item.trim().toLowerCase());
  if (!allowed.includes(extension)) {
    message.warning(`仅支持 ${props.accept} 格式`);
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleChange(info: UploadChangeParam) {
  if (info.file.status === 'done') {
    const response = info.file.response as
      | undefined
      | { Code?: number | string; Data?: { url?: string }; Msg?: string };
    if (String(response?.Code ?? '') === '200' && response?.Data?.url) {
      modelValue.value = response.Data.url;
    } else {
      message.error(response?.Msg || '文件上传失败');
    }
  } else if (info.file.status === 'error') {
    message.error('文件上传失败');
  }
}
</script>

<template>
  <div class="asset-field">
    <div class="preview">
      <img
        v-if="modelValue && image"
        :src="previewUrl"
        alt="预览"
      />
      <a
        v-else-if="modelValue"
        :href="previewUrl"
        rel="noopener noreferrer"
        target="_blank"
      >
        查看文件
      </a>
      <span v-else>暂无文件</span>
    </div>
    <div class="actions">
      <Upload
        :accept="accept"
        :action="uploadUrl"
        :before-upload="beforeUpload"
        :show-upload-list="false"
        @change="handleChange"
      >
        <Button size="small">{{ modelValue ? '重新上传' : '上传文件' }}</Button>
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
.asset-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 78px;
  overflow: hidden;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 35%);
  border: 1px dashed hsl(var(--border));
  border-radius: 6px;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
