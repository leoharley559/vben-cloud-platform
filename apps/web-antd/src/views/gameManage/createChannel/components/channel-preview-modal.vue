<script lang="ts" setup>
import { computed } from 'vue';

import { Button, message, Modal, Space } from 'ant-design-vue';

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
    width="min(980px, calc(100vw - 32px))"
    @cancel="emit('update:open', false)"
  >
    <Space class="mb-3 w-full" direction="vertical">
      <div class="break-all rounded bg-gray-50 p-3 text-sm">{{ url }}</div>
      <Space>
        <Button type="primary" @click="copyUrl">复制地址</Button>
        <Button :href="url" target="_blank">新窗口打开</Button>
      </Space>
    </Space>
    <iframe
      v-if="url"
      class="channel-preview-frame"
      :src="url"
      title="渠道地址预览"
    ></iframe>
  </Modal>
</template>

<style scoped>
.channel-preview-frame {
  width: 100%;
  height: min(68vh, 720px);
  min-height: 460px;
  border: 1px solid rgb(229 231 235);
  border-radius: 6px;
}
</style>
