<script lang="ts" setup>
import type { PlayerAdjustListItem } from '#/types/player-detail';

import { computed, ref, watch } from 'vue';

import { Form, Input, Modal, message } from 'ant-design-vue';

import { disposeAccountAdjustAuditApi } from '#/api/operationManage/account-adjust';
import PassPopup from '#/components/security/pass-popup.vue';
import { formatAmountFromCent } from '#/utils/format-amount';
import { ACCOUNT_ADJUST_AUDIT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'AdjustAuditActionModal' });

const props = defineProps<{
  open: boolean;
  row: PlayerAdjustListItem | null;
  selectedAccounts?: string;
  selectedIds: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
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

function handleOk() {
  if (!remark.value.trim()) {
    message.warning('请填写拒绝备注');
    return;
  }
  passPopupRef.value?.validate(ACCOUNT_ADJUST_AUDIT_PAGE_ID);
}

async function handlePassConfirm(data: Record<string, unknown>) {
  submitting.value = true;
  try {
    await disposeAccountAdjustAuditApi({
      Approve: 3,
      ApproveRemark: remark.value,
      Ids: props.row?.Id || props.selectedIds,
      LoginAccount: displayAccount.value,
      PlayerId: props.row?.PlayerId || '',
      ValidCode: data.ValidCode || '',
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
    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
  </Modal>
</template>
