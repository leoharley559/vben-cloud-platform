<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal } from 'ant-design-vue';

import {
  updateDeviceRiskApi,
  updateIpRiskApi,
} from '#/api/operationManage/game-risk-control';

defineOptions({ name: 'RiskRecordEditModal' });

const props = defineProps<{
  kind: 'device' | 'ip';
  open: boolean;
  row: null | Record<string, unknown>;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const saving = ref(false);
const form = reactive({
  Desc: '',
  Id: '' as number | string,
  LoginAccount: '',
  RiskValue: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open || !props.row) {
      return;
    }
    form.Id = (props.row.Id as number | string) ?? '';
    form.RiskValue = String(props.row.RiskValue || '');
    form.LoginAccount = String(props.row.LoginAccount || '');
    form.Desc = String(props.row.Desc || props.row.Remark || '');
  },
);

function close() {
  emit('update:open', false);
}

async function handleOk() {
  if (form.Id === '' || form.Id === undefined) {
    return;
  }
  saving.value = true;
  try {
    const payload = { Desc: form.Desc.trim(), Id: form.Id };
    await (props.kind === 'ip' ? updateIpRiskApi(payload) : updateDeviceRiskApi(payload));
    message.success('已更新');
    close();
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    destroy-on-close
    :open="open"
    title="编辑备注"
    @cancel="close"
    @ok="handleOk"
    @update:open="(v) => emit('update:open', v)"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item :label="kind === 'ip' ? 'IP 地址' : '设备标识'">
        <Input :value="form.RiskValue" disabled />
      </Form.Item>
      <Form.Item label="关联游戏账号">
        <Input.TextArea :value="form.LoginAccount || '-'" :rows="2" disabled />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="form.Desc"
          :rows="3"
          allow-clear
          placeholder="请输入备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
