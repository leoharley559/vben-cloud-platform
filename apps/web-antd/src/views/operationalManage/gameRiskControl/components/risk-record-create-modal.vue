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

defineOptions({ name: 'RiskRecordCreateModal' });

const props = defineProps<{
  kind: 'device' | 'ip';
  /** blacklist=1 whitelist=2 */
  listType?: 'blacklist' | 'whitelist';
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();

const loading = ref(false);
const saving = ref(false);
const multiInfo = ref<Array<Record<string, unknown>>>([]);
const listType = computed(() => props.listType || 'blacklist');
const typeValue = computed(() => (listType.value === 'whitelist' ? 2 : 1));

const form = reactive({
  BlockAccount: false,
  Desc: '',
  LoginAccount: '',
  Operator: '',
  RiskValue: '',
});

const title = computed(() => {
  const kindLabel = props.kind === 'ip' ? 'IP' : '设备';
  const listLabel = listType.value === 'whitelist' ? '白名单' : '黑名单';
  return `新增 ${kindLabel}${listLabel}`;
});
const valueLabel = computed(() =>
  props.kind === 'ip' ? 'IP 地址' : '设备标识',
);

function resolveOperator() {
  const info = adminInfo.value as null | Record<string, unknown>;
  const admin = info?.Admin as undefined | { Username?: string };
  return admin?.Username || String(info?.AdminName || info?.Account || '');
}

async function prefetchPlayers() {
  const riskValue = form.RiskValue.trim();
  if (!riskValue) {
    form.LoginAccount = '';
    multiInfo.value = [];
    return;
  }
  loading.value = true;
  try {
    const payload = {
      Enabled: 1,
      Operator: form.Operator,
      RiskType: props.kind === 'ip' ? 1 : 4,
      RiskValue: riskValue,
      Type: typeValue.value,
    };
    const result =
      props.kind === 'ip'
        ? await fetchIpRiskPlayersApi(payload)
        : await fetchDeviceRiskPlayersApi(payload);
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
  (open) => {
    if (!open) {
      return;
    }
    form.Operator = resolveOperator();
    form.RiskValue = '';
    form.Desc = '';
    form.BlockAccount = false;
    form.LoginAccount = '';
    multiInfo.value = [];
  },
);

function close() {
  emit('update:open', false);
}

async function handleOk() {
  if (!form.RiskValue.trim()) {
    message.warning(`请填写${valueLabel.value}`);
    return;
  }
  if (multiInfo.value.length === 0) {
    await prefetchPlayers();
  }
  saving.value = true;
  try {
    const info =
      multiInfo.value.length > 0
        ? multiInfo.value
        : [{ RiskValue: form.RiskValue.trim() }];
    const payload: Record<string, unknown> = {
      Desc: form.Desc.trim(),
      Enabled: 1,
      LoginAccount: form.LoginAccount,
      MultiInfo: JSON.stringify(info),
      Operator: form.Operator,
      RadioType: 1,
      RiskType: props.kind === 'ip' ? 1 : 4,
      Type: typeValue.value,
    };
    if (listType.value === 'blacklist') {
      payload.BlockAccount = form.BlockAccount ? 1 : 0;
    }
    const result =
      props.kind === 'ip'
        ? await createIpRiskApi(payload)
        : await createDeviceRiskApi(payload);

    const fail = Number(result?.FailCount || 0);
    const success = Number(result?.SuccessCount || 0);
    if (fail === 0) {
      message.success('新增成功');
    } else if (success === 0) {
      message.error('新增失败');
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
      <Form.Item :label="valueLabel" required>
        <Input
          v-model:value="form.RiskValue"
          allow-clear
          :placeholder="`请输入${valueLabel}`"
          @blur="prefetchPlayers"
          @press-enter="prefetchPlayers"
        />
      </Form.Item>
      <Form.Item label="关联游戏账号">
        <Input.TextArea
          :value="form.LoginAccount || (loading ? '查询中…' : '失焦后自动查询')"
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
      <Checkbox
        v-if="listType === 'blacklist'"
        v-model:checked="form.BlockAccount"
      >
        同时封停关联账号
      </Checkbox>
    </Form>
  </Modal>
</template>
