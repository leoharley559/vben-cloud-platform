<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Input, Modal, message } from 'ant-design-vue';

defineOptions({ name: 'PlayerBulkAccountModal' });

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ initialValue?: string }>();
const emit = defineEmits<{
  confirm: [value: string];
}>();

const text = ref('');

watch(open, (visible) => {
  if (visible) {
    text.value = props.initialValue || '';
  }
});

function handleOk() {
  const normalized = text.value
    .replaceAll('，', ',')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
  if (!normalized) {
    message.warning('请输入至少一个游戏账号');
    return;
  }
  emit('confirm', normalized);
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="批量账号"
    ok-text="确定"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="mb-2 text-sm text-gray-500">
      支持换行或逗号分隔多个游戏账号，确认后填入查询条件。
    </p>
    <Input.TextArea
      v-model:value="text"
      :rows="8"
      placeholder="账号1&#10;账号2&#10;账号3"
    />
  </Modal>
</template>
