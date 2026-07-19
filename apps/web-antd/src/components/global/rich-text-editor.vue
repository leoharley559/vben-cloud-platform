<script lang="ts" setup>
import type { ImageUploadOptions } from '@vben/plugins/tiptap';

import { computed } from 'vue';

import { VbenTiptap } from '@vben/plugins/tiptap';
import { message } from 'ant-design-vue';

import { useAccessStore } from '@vben/stores';

import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';
import { getAuthToken, getCloudToken } from '#/utils/auth-token';
import { ensureAuthToken } from '#/utils/ensure-auth-token';

defineOptions({ name: 'RichTextEditor' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    maxHeight?: number | string;
    minHeight?: number | string;
    placeholder?: string;
  }>(),
  {
    disabled: false,
    maxHeight: 360,
    minHeight: 200,
    placeholder: '请输入内容',
  },
);

const modelValue = defineModel<string>({ default: '' });
const accessStore = useAccessStore();

const imageUpload = computed<ImageUploadOptions>(() => ({
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024,
  onUploadError: (error) => {
    message.error(error instanceof Error ? error.message : '图片上传失败');
  },
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = getCloudToken() || accessStore.accessToken;
    if (token) {
      headers.Authorization = token;
      headers.Token = token;
    }
    const authToken = ensureAuthToken() || getAuthToken();
    if (authToken) {
      headers.AuthToken = authToken;
    }
    const response = await fetch(getUploadMd5ImageUrl(), {
      body: formData,
      headers,
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`上传失败(${response.status})`);
    }
    const data = (await response.json()) as {
      Code?: number | string;
      Data?: { url?: string };
      Msg?: string;
      message?: string;
      respond?: { url?: string };
      status?: number;
    };
    const ok =
      String(data.Code ?? data.status ?? '') === '200' || data.status === 200;
    const url = data.Data?.url || data.respond?.url;
    if (!ok || !url) {
      throw new Error(data.Msg || data.message || '图片上传失败');
    }
    return getServiceImageUrl(url);
  },
}));
</script>

<template>
  <VbenTiptap
    v-model="modelValue"
    :editable="!disabled"
    :image-upload="imageUpload"
    :max-height="maxHeight"
    :min-height="minHeight"
    :placeholder="placeholder"
    :previewable="true"
    :toolbar="true"
  />
</template>
