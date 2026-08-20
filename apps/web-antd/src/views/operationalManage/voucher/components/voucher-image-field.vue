<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed } from 'vue';

import { useAccessStore } from '@vben/stores';

import { Button, message, Upload } from 'ant-design-vue';

import { getAuthToken, getCloudToken } from '#/utils/auth-token';
import { ensureAuthToken } from '#/utils/ensure-auth-token';
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
const accessStore = useAccessStore();

const previewUrl = computed(() => getServiceImageUrl(modelValue.value));

/** 对齐旧站 el-upload：字段名 upfile，并带登录态请求头 */
const uploadHeaders = computed(() => {
  const headers: Record<string, string> = {};
  const token = getCloudToken() || accessStore.accessToken;
  if (token) {
    headers.Token = token;
  }
  const authToken = ensureAuthToken() || getAuthToken();
  if (authToken) {
    headers.AuthToken = authToken;
  }
  return headers;
});

function beforeUpload(file: File) {
  if (props.maxSizeKb && file.size > props.maxSizeKb * 1024) {
    message.warning(`图片大小不能超过 ${props.maxSizeKb}K`);
    return Upload.LIST_IGNORE;
  }
  return true;
}

function resolveUploadUrl(response: unknown): string {
  const data = response as
    | undefined
    | {
        Code?: number | string;
        Data?: string | { url?: string };
        message?: string;
        Msg?: string;
        respond?: string | { url?: string };
        status?: number | string;
      };
  const ok = String(data?.Code ?? data?.status ?? '') === '200';
  if (!ok) {
    return '';
  }
  if (typeof data?.Data === 'string' && data.Data) {
    return data.Data;
  }
  if (data?.Data && typeof data.Data === 'object' && data.Data.url) {
    return data.Data.url;
  }
  if (typeof data?.respond === 'string' && data.respond) {
    return data.respond;
  }
  if (data?.respond && typeof data.respond === 'object' && data.respond.url) {
    return data.respond.url;
  }
  return '';
}

function handleChange(info: UploadChangeParam) {
  if (info.file.status === 'uploading') {
    return;
  }
  if (info.file.status === 'done') {
    const response = info.file.response as
      | undefined
      | { message?: string; Msg?: string; };
    const url = resolveUploadUrl(info.file.response);
    if (url) {
      modelValue.value = url;
      return;
    }
    const status = String(
      (info.file.response as undefined | { status?: number })?.status ?? '',
    );
    const errMsg =
      response?.Msg ||
      response?.message ||
      (status === '10010'
        ? '上传失败：权限不足（请重启本地服务后重试，确认请求走 /api/resource/...）'
        : '图片上传失败');
    message.error(errMsg);
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
        :headers="uploadHeaders"
        :show-upload-list="false"
        accept="image/*"
        name="upfile"
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
      <div v-else class="text-xs text-gray-400">不超过 {{ maxSizeKb }}K</div>
    </div>
  </div>
</template>
