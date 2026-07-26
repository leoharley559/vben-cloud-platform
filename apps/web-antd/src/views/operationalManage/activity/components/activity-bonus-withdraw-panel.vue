<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  InputNumber,
  Spin,
  Switch,
  Table,
  message,
} from 'ant-design-vue';

import {
  fetchBonusWithdrawConfigApi,
  updateBonusWithdrawCountdownApi,
  updateBonusWithdrawElementApi,
} from '#/api/operationManage/bonus-withdraw-config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { parseJsonArray } from '#/utils/activity-manage';

defineOptions({ name: 'ActivityBonusWithdrawPanel' });

interface ParamRow {
  BonusMax?: number;
  BonusRate?: number;
  Switch?: number;
  TurnoverMultiple?: number;
  WithdrawType?: number;
}

const WITHDRAW_TYPE_MAP: Record<number, string> = {
  1: '普通提款',
  2: '预约提款',
  3: '极速提款',
};

const { checkPermission } = useCloudPermission();
const canEdit = computed(() => checkPermission(12396));

const loading = ref(false);
const savingCountdown = ref(false);
const savingParam = ref(false);

const form = reactive({
  AutoCountdown: undefined as number | undefined,
  UserCountdown: undefined as number | undefined,
});

const paramRows = ref<ParamRow[]>([]);
const fullConfig = ref<Record<string, unknown>>({});

const columns = [
  {
    customRender: ({ record }: { record: ParamRow }) =>
      WITHDRAW_TYPE_MAP[Number(record.WithdrawType)] ||
      String(record.WithdrawType ?? '-'),
    key: 'WithdrawType',
    title: '提款类型',
  },
  {
    key: 'Switch',
    title: '开关',
  },
  {
    customRender: ({ record }: { record: ParamRow }) =>
      record.BonusRate !== undefined
        ? `${Number(record.BonusRate) / 100}%`
        : '-',
    key: 'BonusRate',
    title: '加送比例',
  },
  {
    customRender: ({ record }: { record: ParamRow }) =>
      record.BonusMax !== undefined
        ? formatAmountFromCent(record.BonusMax)
        : '-',
    key: 'BonusMax',
    title: '最高加送',
  },
  {
    dataIndex: 'TurnoverMultiple',
    key: 'TurnoverMultiple',
    title: '流水倍数',
  },
];

async function loadConfig() {
  loading.value = true;
  try {
    const data = await fetchBonusWithdrawConfigApi();
    fullConfig.value = (data || {}) as Record<string, unknown>;
    form.UserCountdown =
      Number(fullConfig.value.UserCountdown || 0) || undefined;
    form.AutoCountdown =
      Number(fullConfig.value.AutoCountdown || 0) || undefined;
    paramRows.value = parseJsonArray<ParamRow>(fullConfig.value.Param);
  } finally {
    loading.value = false;
  }
}

async function saveCountdown() {
  if (!form.UserCountdown || !form.AutoCountdown) {
    message.warning('请填写倒数时间');
    return;
  }
  if (form.UserCountdown >= form.AutoCountdown) {
    message.warning('自动确认时间需大于用户确认时间');
    return;
  }
  savingCountdown.value = true;
  try {
    await updateBonusWithdrawCountdownApi({
      ...fullConfig.value,
      AutoCountdown: form.AutoCountdown,
      Param: JSON.stringify(paramRows.value),
      UserCountdown: form.UserCountdown,
    });
    message.success('保存成功');
    await loadConfig();
  } finally {
    savingCountdown.value = false;
  }
}

async function saveParams() {
  savingParam.value = true;
  try {
    await updateBonusWithdrawElementApi({
      ...fullConfig.value,
      AutoCountdown: form.AutoCountdown,
      Param: JSON.stringify(paramRows.value),
      UserCountdown: form.UserCountdown,
    });
    message.success('保存成功');
    await loadConfig();
  } finally {
    savingParam.value = false;
  }
}

async function handleSwitch(row: ParamRow, checked: boolean) {
  row.Switch = checked ? 1 : 0;
  await saveParams();
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Spin :spinning="loading">
    <div class="mb-6">
      <div class="mb-3 font-medium">倒数时间配置</div>
      <Form layout="inline" class="gap-y-3">
        <Form.Item label="用户确认彩金(分钟)">
          <InputNumber
            v-model:value="form.UserCountdown"
            :disabled="!canEdit"
            :min="1"
            class="!w-32"
          />
        </Form.Item>
        <Form.Item label="到账自动确认(分钟)">
          <InputNumber
            v-model:value="form.AutoCountdown"
            :disabled="!canEdit"
            :min="1"
            class="!w-32"
          />
        </Form.Item>
        <Form.Item>
          <Button
            v-if="canEdit"
            :loading="savingCountdown"
            type="primary"
            @click="saveCountdown"
          >
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>

    <div>
      <div class="mb-3 font-medium">彩金设置</div>
      <Table
        :columns="columns"
        :data-source="paramRows"
        :pagination="false"
        :row-key="(row) => `param-${row.Key ?? row.Name ?? JSON.stringify(row)}`"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'Switch'">
            <Switch
              :checked="Number(record.Switch) === 1"
              :disabled="!canEdit"
              @change="(checked) => handleSwitch(record, !!checked)"
            />
          </template>
        </template>
      </Table>
      <div class="mt-3 text-xs text-gray-400">
        单行参数编辑弹窗尚未迁移；开关变更会调用 editconfig 保存。
      </div>
    </div>
  </Spin>
</template>
