<script lang="ts" setup>
import { computed } from 'vue';

import { Button, message, Modal } from 'ant-design-vue';

const props = defineProps<{
  channelName?: string;
  open: boolean;
  title?: string;
  url?: string;
}>();

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const modalTitle = computed(
  () =>
    `${props.title || '渠道地址'}${props.channelName ? ` · ${props.channelName}` : ''}`,
);

async function copyUrl() {
  if (!props.url) return;
  try {
    await navigator.clipboard.writeText(props.url);
    message.success('地址已复制');
  } catch {
    const input = document.createElement('textarea');
    input.value = props.url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    message.success('地址已复制');
  }
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    :title="modalTitle"
    centered
    destroy-on-close
    width="min(540px, calc(100vw - 16px))"
    wrap-class-name="channel-preview-modal"
    @cancel="emit('update:open', false)"
  >
    <div class="mb-3 flex w-full min-w-0 items-stretch gap-2">
      <div
        class="flex min-w-0 flex-1 items-center overflow-hidden rounded bg-gray-50 px-2 text-xs dark:bg-gray-800"
        :title="url"
      >
        <span class="truncate">{{ url }}</span>
      </div>
      <Button type="primary" @click="copyUrl">复制地址</Button>
      <Button :href="url" target="_blank">新窗口打开</Button>
    </div>
    <div v-if="url" class="preview-screen">
      <iframe
        :src="url"
        title="渠道地址预览"
        width="100%"
        height="100%"
      ></iframe>
    </div>
  </Modal>
</template>

<style scoped>
.preview-screen {
  position: relative;
  width: 340px;
  max-width: 100%;
  margin: 8px auto 4px;
  overflow: hidden;
  aspect-ratio: 340 / 600;
  background: #fff;
}

.preview-screen iframe {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>

<style>
.channel-preview-modal .ant-modal {
  max-width: calc(100vw - 16px);
  margin: 8px auto;
}

.channel-preview-modal .ant-modal-body {
  padding: 12px;
}
</style>
