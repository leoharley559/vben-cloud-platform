<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Button, DatePicker, Input, Modal, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'PlayerAdvancedSearchModal' });

const emit = defineEmits<{
  apply: [filters: AdvancedFilterRow[]];
}>();

export interface AdvancedFilterRow {
  Connector: string;
  DateTime?: number | string;
  FieldId: number | string;
  Operator: string;
  Type: number;
  Value: string;
}

const open = defineModel<boolean>('open', { default: false });
const { projectConfig } = useProjectConfig();

const TYPE_OPTIONS = [
  { label: '充值', value: 1 },
  { label: '登录', value: 2 },
];

const FIELD_MAP: Record<number, Array<{ label: string; value: number }>> = {
  1: [
    { label: '充值次数', value: 1 },
    { label: '金额', value: 2 },
    { label: '上次充值时间', value: 3 },
    { label: '首次充值时间', value: 4 },
    { label: '首存金额', value: 5 },
  ],
  2: [
    { label: '最后登录时间', value: 7 },
    { label: '连续未登录天数', value: 8 },
    { label: '登录次数', value: 9 },
    { label: '最后登录设备', value: 10 },
  ],
};

const OPERATOR_OPTIONS = ['=', '!=', '>', '<', '>=', '<='].map((item) => ({
  label: item,
  value: item,
}));

function emptyRow(isFirst = false): AdvancedFilterRow {
  return {
    Connector: 'AND',
    DateTime: '',
    FieldId: isFirst ? 1 : '',
    Operator: '=',
    Type: 1,
    Value: '',
  };
}

const filters = ref<AdvancedFilterRow[]>([emptyRow(true)]);

const deviceOptions = reactive<Array<{ label: string; value: string }>>([]);

watch(
  () => projectConfig.value?.DevicePlatformAll,
  (map) => {
    deviceOptions.splice(0);
    if (map && typeof map === 'object') {
      for (const [value, label] of Object.entries(map)) {
        deviceOptions.push({ label: String(label), value: String(value) });
      }
    }
  },
  { immediate: true },
);

watch(open, (visible) => {
  if (visible && filters.value.length === 0) {
    filters.value = [emptyRow(true)];
  }
});

function fieldOptions(type: number) {
  return FIELD_MAP[type] || [];
}

function isDateField(fieldId: number | string) {
  return [3, 4, 7].includes(Number(fieldId));
}

function isDeviceField(fieldId: number | string) {
  return Number(fieldId) === 10;
}

function usedFieldIds(exceptIndex: number) {
  return new Set(
    filters.value
      .map((row, index) => (index === exceptIndex ? '' : Number(row.FieldId)))
      .filter((id) => id !== '' && !Number.isNaN(Number(id))),
  );
}

function addRow() {
  if (filters.value.length >= 3) {
    return;
  }
  filters.value.push(emptyRow());
}

function removeRow(index: number) {
  if (index === 0) {
    return;
  }
  filters.value.splice(index, 1);
}

function handleReset() {
  filters.value = [emptyRow(true)];
}

function handleApply() {
  const payload = filters.value.map((row) => {
    const next = { ...row };
    if (isDateField(row.FieldId) && row.DateTime) {
      const ts = Number(row.DateTime);
      next.Value = String(Math.floor(ts > 1e12 ? ts / 1000 : ts));
    }
    return next;
  });
  emit('apply', payload);
  open.value = false;
}

function onTypeChange(row: AdvancedFilterRow) {
  row.FieldId = '';
  row.Value = '';
  row.DateTime = '';
}

function onFieldChange(row: AdvancedFilterRow) {
  row.Value = '';
  row.DateTime = '';
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="高级搜索"
    width="720px"
    :footer="null"
    destroy-on-close
  >
    <div class="flex flex-col gap-3">
      <div
        v-for="(row, index) in filters"
        :key="index"
        class="flex flex-wrap items-center gap-2"
      >
        <Select
          v-model:value="row.Connector"
          :style="{ width: '80px', opacity: index === 0 ? 0 : 1 }"
          :options="[
            { label: '且', value: 'AND' },
            { label: '或', value: 'OR' },
          ]"
        />
        <Select
          v-model:value="row.Type"
          style="width: 100px"
          :options="TYPE_OPTIONS"
          @change="() => onTypeChange(row)"
        />
        <Select
          v-model:value="row.FieldId"
          style="width: 150px"
          :options="
            fieldOptions(row.Type).map((item) => ({
              ...item,
              disabled: usedFieldIds(index).has(item.value),
            }))
          "
          @change="() => onFieldChange(row)"
          placeholder="请选择字段"
        />
        <Select
          v-model:value="row.Operator"
          style="width: 80px"
          :options="OPERATOR_OPTIONS"
        />
        <DatePicker
          v-if="isDateField(row.FieldId)"
          :value="row.DateTime ? dayjs(Number(row.DateTime)) : undefined"
          show-time
          style="width: 200px"
          @update:value="
            (val) => {
              row.DateTime = val ? val.valueOf() : '';
            }
          "
        />
        <Select
          v-else-if="isDeviceField(row.FieldId)"
          v-model:value="row.Value"
          style="width: 200px"
          :options="deviceOptions"
          placeholder="请选择设备"
        />
        <Input
          v-else
          v-model:value="row.Value"
          style="width: 200px"
          placeholder="请输入"
        />
        <Button type="primary" :disabled="filters.length >= 3" @click="addRow">
          +
        </Button>
        <Button :disabled="index === 0" @click="removeRow(index)">-</Button>
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <Button @click="handleReset">重置</Button>
      <Button type="primary" @click="handleApply">搜索</Button>
    </div>
  </Modal>
</template>
