<script lang="ts" setup>
import type { PlayerAuthListItem } from '#/types/player-authentication';

import { ref, watch } from 'vue';

import { Form, Input, Modal } from 'ant-design-vue';

import { approvePlayerAuthApi } from '#/api/memberManage/player-authentication';

defineOptions({ name: 'AuthAuditActionModal' });

const props = defineProps<{
  action: 'approve' | 'reject';
  open: boolean;
  orderIds: string;
  row: null | PlayerAuthListItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const remark = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      remark.value = '';
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!props.orderIds) {
    return;
  }
  submitting.value = true;
  try {
    await approvePlayerAuthApi({
      IsApprove: props.action === 'approve',
      OrderId: props.orderIds,
      Remark: remark.value,
    });
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
    :title="action === 'approve' ? '通过审核' : '拒绝审核'"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <div v-if="row?.LoginAccount" class="mb-3 text-sm text-gray-500">
      账号：{{ row.LoginAccount }}（ID: {{ row.PlayerId || '-' }}）
    </div>
    <Form layout="vertical">
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="remark"
          :rows="4"
          placeholder="请输入备注（选填）"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
