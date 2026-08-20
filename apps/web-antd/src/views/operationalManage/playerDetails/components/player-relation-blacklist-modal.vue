<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Checkbox, Form, Input, message, Modal } from 'ant-design-vue';

import {
  createDeviceRiskApi,
  createIpRiskApi,
  fetchDeviceRiskPlayersApi,
  fetchIpRiskPlayersApi,
} from '#/api/operationManage/game-risk-control';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'PlayerRelationBlacklistModal' });

const props = defineProps<{
  open: boolean;
  /** 1=设备 2=IP */
  relationType: 1 | 2;
  riskValue: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();

const loading = ref(false);
const saving = ref(false);
const multiInfo = ref<Array<Record<string, unknown>>>([]);

const form = reactive({
  BlockAccount: false,
  Desc: '',
  LoginAccount: '',
  Operator: '',
  RiskValue: '',
});

const title = computed(() =>
  props.relationType === 1 ? '设备拉黑' : 'IP 拉黑',
);
const valueLabel = computed(() =>
  props.relationType === 1 ? '设备号' : 'IP 地址',
);

function resolveOperator() {
  const info = adminInfo.value as null | Record<string, unknown>;
  const admin = info?.Admin as undefined | { Username?: string };
  return admin?.Username || String(info?.AdminName || info?.Account || '');
}

async function prefetchPlayers() {
  if (!props.riskValue) {
    return;
  }
  loading.value = true;
  try {
    const payload = {
      Enabled: 1,
      Operator: form.Operator,
      RiskType: props.relationType === 1 ? 4 : 1,
      RiskValue: props.riskValue,
      Type: 1,
    };
    const result =
      props.relationType === 1
        ? await fetchDeviceRiskPlayersApi(payload)
        : await fetchIpRiskPlayersApi(payload);
    const items = result?.Items || [];
    multiInfo.value = items;
    form.LoginAccount = items
      .map((item) => String(item.LoginAccount || ''))
      .filter(Boolean)
      .join(', ');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    form.RiskValue = props.riskValue;
    form.Operator = resolveOperator();
    form.Desc = '';
    form.BlockAccount = false;
    form.LoginAccount = '';
    multiInfo.value = [];
    await prefetchPlayers();
  },
);

function close() {
  emit('update:open', false);
}

async function handleOk() {
  saving.value = true;
  try {
    const payload = {
      BlockAccount: form.BlockAccount ? 1 : 0,
      Desc: form.Desc.trim(),
      Enabled: 1,
      LoginAccount: form.LoginAccount,
      MultiInfo: JSON.stringify(multiInfo.value),
      Operator: form.Operator,
      RiskType: props.relationType === 1 ? 4 : 1,
      Type: 1,
    };
    const result =
      props.relationType === 1
        ? await createDeviceRiskApi(payload)
        : await createIpRiskApi(payload);

    const fail = Number(result?.FailCount || 0);
    const success = Number(result?.SuccessCount || 0);
    if (fail === 0) {
      message.success('拉黑成功');
    } else if (success === 0) {
      message.error('拉黑失败');
    } else {
      message.warning(`部分成功：成功 ${success}，失败 ${fail}`);
    }
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
    :title="title"
    @cancel="close"
    @ok="handleOk"
    @update:open="(v) => emit('update:open', v)"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item :label="valueLabel">
        <Input :value="form.RiskValue" disabled />
      </Form.Item>
      <Form.Item label="关联游戏账号">
        <Input.TextArea
          :value="form.LoginAccount || (loading ? '加载中…' : '-')"
          :rows="2"
          disabled
        />
      </Form.Item>
      <Form.Item label="操作人">
        <Input :value="form.Operator" disabled />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="form.Desc"
          :rows="3"
          allow-clear
          placeholder="选填"
        />
      </Form.Item>
      <Checkbox v-model:checked="form.BlockAccount">
        同时封停关联账号
      </Checkbox>
    </Form>
  </Modal>
</template>
