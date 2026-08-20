<script lang="ts" setup>
import type { RechargeBlackDeviceItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import { Checkbox, Form, Input, message, Modal, Switch } from 'ant-design-vue';

import {
  createRechargeBlackDeviceApi,
  updateRechargeBlackDeviceApi,
} from '#/api/operationManage/recharge-extra';
import {
  RECHARGE_SPECIAL_PAY_TYPE,
  useRechargePayTypeOptions,
} from '#/utils/recharge-pay-type';

defineOptions({ name: 'RechargeBlackDeviceModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row: null | RechargeBlackDeviceItem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { options: payOptions } = useRechargePayTypeOptions();

const submitting = ref(false);
const deviceId = ref('');
const remark = ref('');
const payTypes = ref<string[]>([]);
const specialPay = ref(false);
const disableLoginPlayer = ref(false);
const editId = ref<number | string>('');

const title = computed(() =>
  props.mode === 'create' ? '手动添加设备黑名单' : '编辑设备黑名单',
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    submitting.value = false;
    if (props.mode === 'edit' && props.row) {
      editId.value = props.row.Id || '';
      deviceId.value = String(props.row.DeviceId || '');
      remark.value = String(props.row.Remark || '');
      disableLoginPlayer.value = Number(props.row.DisableLoginPlayer) === 1;
      const types = String(props.row.PayType || '')
        .split(',')
        .filter(Boolean);
      specialPay.value = types.includes(RECHARGE_SPECIAL_PAY_TYPE);
      payTypes.value = types.filter(
        (item) => item !== RECHARGE_SPECIAL_PAY_TYPE,
      );
      return;
    }
    editId.value = '';
    deviceId.value = '';
    remark.value = '';
    payTypes.value = [];
    specialPay.value = false;
    disableLoginPlayer.value = false;
  },
);

function closeModal() {
  emit('update:open', false);
}

function buildPayType() {
  const values = [...payTypes.value];
  if (specialPay.value) {
    values.push(RECHARGE_SPECIAL_PAY_TYPE);
  }
  return values.join(',');
}

async function handleOk() {
  if (!deviceId.value.trim()) {
    message.warning('请输入设备号');
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      DeviceId: deviceId.value.trim(),
      DisableLoginPlayer: disableLoginPlayer.value ? 1 : 0,
      PayType: buildPayType(),
      Remark: remark.value,
    };
    if (props.mode === 'create') {
      await createRechargeBlackDeviceApi({
        ...payload,
        MultiInfo: '',
      });
      message.success('新增成功');
    } else {
      await updateRechargeBlackDeviceApi({
        ...payload,
        Id: editId.value,
      });
      message.success('编辑成功');
    }
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
    :title="title"
    width="560px"
    @cancel="closeModal"
    @ok="handleOk"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item label="设备号" required>
        <Input
          v-model:value="deviceId"
          :disabled="mode === 'edit'"
          allow-clear
          placeholder="请输入设备号"
        />
      </Form.Item>
      <Form.Item label="允许充值方式">
        <Checkbox.Group v-model:value="payTypes" class="flex flex-wrap gap-2">
          <Checkbox
            v-for="item in payOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Checkbox>
        </Checkbox.Group>
        <div class="mt-2">
          <Checkbox v-model:checked="specialPay">极速支付</Checkbox>
        </div>
      </Form.Item>
      <Form.Item label="同时禁止登录玩家">
        <Switch v-model:checked="disableLoginPlayer" />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          allow-clear
          placeholder="请输入备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
