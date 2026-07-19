<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  InputNumber,
  Result,
  Space,
  Switch,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  fetchRegConfigApi,
  updateRegConfigApi,
} from '#/api/operationManage/game-risk-control';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'RegConfigPanel' });

interface RegConfigRow {
  IsOn?: boolean | number;
  LimitAmt?: number;
  SubType?: number;
  Type?: number;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const canEdit = computed(() => checkPermission(12973));

const loading = ref(false);
const ipSaving = ref(false);
const deviceSaving = ref(false);
const original = ref<RegConfigRow[]>([]);

const ipForm = reactive({
  IsOn: false,
  LimitAmt: 0,
  SubType: 1 as const,
  Type: 1,
});

const deviceForm = reactive({
  IsOn: false,
  LimitAmt: 0,
  SubType: 2 as const,
  Type: 1,
});

const ipChanged = computed(() => {
  const row = original.value[0];
  if (!row) {
    return false;
  }
  return (
    Boolean(ipForm.IsOn) !== Boolean(row.IsOn) ||
    Number(ipForm.LimitAmt) !== Number(row.LimitAmt || 0)
  );
});

const deviceChanged = computed(() => {
  const row = original.value[1];
  if (!row) {
    return false;
  }
  return (
    Boolean(deviceForm.IsOn) !== Boolean(row.IsOn) ||
    Number(deviceForm.LimitAmt) !== Number(row.LimitAmt || 0)
  );
});

function normalizeRows(data: unknown): RegConfigRow[] {
  if (Array.isArray(data)) {
    return data as RegConfigRow[];
  }
  if (data && typeof data === 'object') {
    const obj = data as { Items?: RegConfigRow[] };
    if (Array.isArray(obj.Items)) {
      return obj.Items;
    }
  }
  return [];
}

async function loadConfig() {
  if (!canEdit.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchRegConfigApi({ Type: 1 });
    const rows = normalizeRows(result);
    original.value = JSON.parse(JSON.stringify(rows)) as RegConfigRow[];
    const ip = rows[0];
    const device = rows[1];
    if (ip) {
      ipForm.Type = Number(ip.Type || 1);
      ipForm.SubType = 1;
      ipForm.IsOn = Boolean(ip.IsOn);
      ipForm.LimitAmt = Number(ip.LimitAmt || 0);
    }
    if (device) {
      deviceForm.Type = Number(device.Type || 1);
      deviceForm.SubType = 2;
      deviceForm.IsOn = Boolean(device.IsOn);
      deviceForm.LimitAmt = Number(device.LimitAmt || 0);
    }
  } finally {
    loading.value = false;
  }
}

async function handleSave(subType: 1 | 2) {
  const form = subType === 1 ? ipForm : deviceForm;
  const saving = subType === 1 ? ipSaving : deviceSaving;
  if (Number(form.LimitAmt) < 0) {
    message.warning('上限不能为负数');
    return;
  }
  saving.value = true;
  try {
    await updateRegConfigApi({
      IsOn: form.IsOn,
      LimitAmt: Number(form.LimitAmt || 0),
      SubType: form.SubType,
      Type: form.Type,
    });
    message.success('已保存');
    await loadConfig();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <div v-if="canEdit">
    <Card class="mb-4" size="small" title="IP 设置" :loading="loading">
      <div class="flex flex-wrap items-center gap-4">
        <span class="text-sm font-medium">IP 注册上限开关</span>
        <Tooltip title="开启后，同一 IP 注册次数超过上限将受限">
          <span class="cursor-help text-xs text-gray-400">说明</span>
        </Tooltip>
        <Switch v-model:checked="ipForm.IsOn" />
        <span class="text-sm">同一 IP 注册上限</span>
        <Space>
          <InputNumber
            v-model:value="ipForm.LimitAmt"
            :min="0"
            :precision="0"
            style="width: 120px"
          />
          <span class="text-sm text-gray-500">次</span>
        </Space>
        <Button
          :disabled="!ipChanged"
          :loading="ipSaving"
          type="primary"
          @click="handleSave(1)"
        >
          保存
        </Button>
      </div>
    </Card>

    <Card size="small" title="设备设置" :loading="loading">
      <div class="flex flex-wrap items-center gap-4">
        <span class="text-sm font-medium">设备注册上限开关</span>
        <Tooltip title="开启后，同一设备注册次数超过上限将受限">
          <span class="cursor-help text-xs text-gray-400">说明</span>
        </Tooltip>
        <Switch v-model:checked="deviceForm.IsOn" />
        <span class="text-sm">同一设备注册上限</span>
        <Space>
          <InputNumber
            v-model:value="deviceForm.LimitAmt"
            :min="0"
            :precision="0"
            style="width: 120px"
          />
          <span class="text-sm text-gray-500">次</span>
        </Space>
        <Button
          :disabled="!deviceChanged"
          :loading="deviceSaving"
          type="primary"
          @click="handleSave(2)"
        >
          保存
        </Button>
      </div>
    </Card>
  </div>

  <Result v-else status="403" sub-title="需要权限 12973" title="无权限" />
</template>
