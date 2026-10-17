<script lang="ts" setup>
import type { PlayerAdjustListItem } from '#/types/player-detail';

import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import { disposeAccountAdjustAuditApi } from '#/api/operationManage/account-adjust';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'AdjustAuditActionModal' });

const props = defineProps<{
  open: boolean;
  row: null | PlayerAdjustListItem;
  selectedAccounts?: string;
  selectedIds: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const remark = ref('');

const displayAccount = computed(() =>
  props.row?.LoginAccount
    ? String(props.row.LoginAccount)
    : props.selectedAccounts || '',
);

const displayAmount = computed(() =>
  props.row?.Amount !== undefined && props.row?.Amount !== null
    ? formatAmountFromCent(props.row.Amount)
    : '',
);

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

async function handleOk() {
  if (!remark.value.trim()) {
    message.warning('请填写拒绝备注');
    return;
  }
  submitting.value = true;
  try {
    // 对齐旧站 adjustAudit：拒绝只填备注后直接提交，不弹谷歌验证码
    await disposeAccountAdjustAuditApi({
      Approve: 3,
      ApproveRemark: remark.value,
      Ids: props.row?.Id || props.selectedIds,
      LoginAccount: displayAccount.value,
      PlayerId: props.row?.PlayerId || '',
    });
    message.success('已拒绝');
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
    :title="row ? '拒绝审核' : '批量拒绝'"
    @cancel="closeModal"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item label="玩家账号">
        <Input :value="displayAccount" disabled />
      </Form.Item>
      <Form.Item v-if="row" label="调整金额">
        <Input :value="displayAmount" disabled />
      </Form.Item>
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
