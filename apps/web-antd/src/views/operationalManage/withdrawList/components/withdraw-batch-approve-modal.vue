<script lang="ts" setup>
import type { WithdrawFinanceItem } from '#/types/withdraw-extra';

import { computed, ref, watch } from 'vue';

import { Form, Modal, Select } from 'ant-design-vue';

import {
  batchApproveWithdrawApi,
  fetchWithdrawChannelOptionsApi,
  mapWithdrawChannelOptions,
} from '#/api/operationManage/withdraw';

defineOptions({ name: 'WithdrawBatchApproveModal' });

const props = defineProps<{
  open: boolean;
  rows: WithdrawFinanceItem[];
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const channelLoading = ref(false);
const withdrawAccountId = ref<number | string>();
const channelOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

const selectedIds = computed(() =>
  props.rows
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);

const accountTypes = computed(() =>
  props.rows.map((row) => row.AccountType).filter((item) => item !== undefined),
);

const isSameAccountType = computed(() => {
  if (accountTypes.value.length === 0) {
    return false;
  }
  const first = accountTypes.value[0];
  return accountTypes.value.every((item) => item === first);
});

watch(
  () => [props.open, selectedIds.value],
  async () => {
    if (!props.open || !selectedIds.value) {
      return;
    }
    withdrawAccountId.value = undefined;
    channelOptions.value = [];
    if (!isSameAccountType.value) {
      return;
    }
    channelLoading.value = true;
    try {
      const result = await fetchWithdrawChannelOptionsApi({
        Batch: 1,
        Ids: selectedIds.value,
        Type: accountTypes.value[0] ?? '',
      });
      channelOptions.value = mapWithdrawChannelOptions(result?.Items);
      withdrawAccountId.value = channelOptions.value[0]?.value;
    } finally {
      channelLoading.value = false;
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!selectedIds.value) {
    return;
  }
  submitting.value = true;
  try {
    await batchApproveWithdrawApi({
      Ids: selectedIds.value,
      WithdrawAccountId: withdrawAccountId.value ?? '',
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
    title="批量同意出款"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <p class="mb-4 text-gray-600">
      确定对选中的 {{ rows.length }} 条订单执行批量同意出款吗？
    </p>
    <Form v-if="isSameAccountType" layout="vertical">
      <Form.Item label="出款通道">
        <Select
          v-model:value="withdrawAccountId"
          :loading="channelLoading"
          :options="channelOptions"
          allow-clear
          placeholder="请选择出款通道"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
    <p v-else class="text-amber-600">
      所选订单出款类型不一致，将不指定出款通道直接提交。
    </p>
  </Modal>
</template>
