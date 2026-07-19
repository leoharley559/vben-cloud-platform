<script lang="ts" setup>
import type { RechargeListItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import {
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
} from 'ant-design-vue';
import BigNumber from 'bignumber.js';

import { manualReviewRechargeApi } from '#/api/operationManage/recharge';
import PassPopup from '#/components/security/pass-popup.vue';
import { RECHARGE_SECURITY_PAGE_ID } from '#/utils/recharge-actions';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'RechargeReviewModal' });

const props = defineProps<{
  mode: 'manual' | 'second';
  operatorName?: string;
  row: RechargeListItem | null;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('open', { default: false });

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const submitting = ref(false);
const realSendAmount = ref<number>();
const remark = ref('');

const title = computed(() =>
  props.mode === 'manual' ? '人工审核' : '充值复核',
);

const defaultAmountYuan = computed(() => {
  const cent = Number(props.row?.RealAmount || props.row?.Amount || 0);
  return cent ? Number((cent / 100).toFixed(2)) : 0;
});

watch(
  () => [visible.value, props.row?.Id],
  () => {
    if (!visible.value) {
      return;
    }
    realSendAmount.value = defaultAmountYuan.value;
    remark.value = '';
  },
  { immediate: true },
);

function buildPayload(validCode?: string) {
  if (!props.row?.Id || !props.row.OrderId) {
    return null;
  }
  const payload: Record<string, unknown> = {
    Id: props.row.Id,
    OrderId: props.row.OrderId,
    Remark: remark.value,
    TypeVerify: props.mode === 'manual' ? 1 : 2,
  };
  if (props.mode === 'manual') {
    payload.Amount = new BigNumber(realSendAmount.value || 0)
      .multipliedBy(100)
      .toNumber();
  }
  if (validCode) {
    payload.ValidCode = validCode;
  }
  return payload;
}

async function submitWithCode(validCode?: string) {
  const payload = buildPayload(validCode);
  if (!payload) {
    return;
  }
  submitting.value = true;
  try {
    await manualReviewRechargeApi(payload);
    message.success('操作成功');
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}

function handleOk() {
  if (
    props.mode === 'manual' &&
    (!realSendAmount.value || realSendAmount.value <= 0)
  ) {
    message.warning('请输入实际汇款金额');
    return;
  }
  passPopupRef.value?.validate(RECHARGE_SECURITY_PAGE_ID);
}

function handlePassConfirm(data: Record<string, unknown>) {
  submitWithCode(String(data.ValidCode || ''));
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="visible"
    :title="title"
    width="560px"
    @cancel="visible = false"
    @ok="handleOk"
  >
    <Descriptions v-if="row" bordered :column="1" size="small" class="mb-4">
      <Descriptions.Item label="游戏账号">
        {{ row.LoginAccount || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="订单编号">
        {{ row.OrderId || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="申请金额">
        {{ formatAmountFromCent(row.RealAmount || row.Amount) }}
      </Descriptions.Item>
      <Descriptions.Item label="VIP">
        {{ row.VipLevel ?? '-' }}
      </Descriptions.Item>
    </Descriptions>

    <Form layout="vertical">
      <Form.Item v-if="mode === 'manual'" label="实际汇款金额（元）" required>
        <InputNumber
          v-model:value="realSendAmount"
          :min="0"
          :precision="2"
          class="w-full"
        />
      </Form.Item>
      <Form.Item :label="mode === 'manual' ? '初审备注' : '复核备注'">
        <Input v-model:value="remark" allow-clear placeholder="请输入备注" />
      </Form.Item>
      <Form.Item :label="mode === 'manual' ? '初审人员' : '复核人员'">
        <Input :value="operatorName" disabled />
      </Form.Item>
    </Form>

    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
  </Modal>
</template>
