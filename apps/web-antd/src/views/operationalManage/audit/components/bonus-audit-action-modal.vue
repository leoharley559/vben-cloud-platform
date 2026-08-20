<script lang="ts" setup>
import type { BonusAuditListItem } from '#/types/bonus-audit';

import { ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import { disposeBonusAuditApi } from '#/api/operationManage/bonus-audit';

defineOptions({ name: 'BonusAuditActionModal' });

const props = defineProps<{
  open: boolean;
  row: BonusAuditListItem | null;
  selectedIds: string;
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
  if (!remark.value.trim()) {
    message.warning('请输入拒绝备注');
    return;
  }
  submitting.value = true;
  try {
    await disposeBonusAuditApi({
      Approve: 3,
      HandleDesc: remark.value,
      Ids: props.row?.Id || props.selectedIds,
      LoginAccount: props.row?.LoginAccount || '',
      PlayerId: props.row?.PlayerId || '',
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
    title="拒绝审核"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="拒绝备注" required>
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          placeholder="请输入拒绝备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
