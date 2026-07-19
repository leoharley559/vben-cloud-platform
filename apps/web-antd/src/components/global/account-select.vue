<script lang="ts" setup>
import type { AdminAccountOption } from '#/types/config';

import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';
import { useDebounceFn } from '@vueuse/core';

import { fetchChildAdminInfoApi } from '#/api/config/index';

defineOptions({ name: 'AccountSelect' });

const props = withDefaults(
  defineProps<{
    dataSearchType?: number;
    disabled?: boolean;
    multiple?: boolean;
    returnName?: boolean;
  }>(),
  {
    dataSearchType: 0,
    disabled: false,
    multiple: true,
    returnName: false,
  },
);

const emit = defineEmits<{
  changeObject: [list: AdminAccountOption[]];
}>();

const modelValue = defineModel<Array<number | string> | number | string>();

const MAX_OPTIONS = 50;

const loading = ref(false);
const options = ref<AdminAccountOption[]>([]);
const accountList = ref<AdminAccountOption[]>([]);

function getOptionValue(item: AdminAccountOption) {
  return props.returnName ? item.Username : item.Id;
}

function getOptionLabel(item: AdminAccountOption) {
  return `${item.Username}(${item.Name || '-'})`;
}

const selectOptions = computed(() =>
  options.value.map((item) => ({
    label: getOptionLabel(item),
    value: getOptionValue(item),
  })),
);

async function fetchAccountList(params: Record<string, unknown> = {}) {
  loading.value = true;
  try {
    const result = await fetchChildAdminInfoApi({
      DataSearchType: props.dataSearchType,
      ...params,
    });
    const list = result?.ChildAdminInfo || [];
    options.value =
      list.length > MAX_OPTIONS ? list.slice(0, MAX_OPTIONS) : list;
    if (!params.UserName) {
      accountList.value = list;
    }
    mergeSelectedOptions();
  } finally {
    loading.value = false;
  }
}

function mergeSelectedOptions() {
  const selectedValues = Array.isArray(modelValue.value)
    ? modelValue.value
    : modelValue.value === undefined || modelValue.value === ''
      ? []
      : [modelValue.value];

  if (!selectedValues.length) {
    return;
  }

  const key = props.returnName ? 'Username' : 'Id';
  const merged = [...options.value];
  const exists = new Set(merged.map((item) => String(getOptionValue(item))));

  for (const selected of selectedValues) {
    const matched = accountList.value.find(
      (item) => String(item[key]) === String(selected),
    );
    if (matched) {
      const value = String(getOptionValue(matched));
      if (!exists.has(value)) {
        merged.push(matched);
        exists.add(value);
      }
    }
  }

  options.value = merged;
}

const handleSearch = useDebounceFn((query: string) => {
  fetchAccountList(query ? { UserName: query } : {});
}, 500);

function handleChange(value: unknown) {
  const normalized = value as
    | Array<number | string>
    | number
    | string
    | undefined;
  modelValue.value = normalized;
  const selectedValues = Array.isArray(normalized)
    ? normalized
    : normalized === undefined || normalized === ''
      ? []
      : [normalized];
  const key = props.returnName ? 'Username' : 'Id';
  const selectedObjects = selectedValues
    .map((selected) =>
      accountList.value.find((item) => String(item[key]) === String(selected)),
    )
    .filter(Boolean) as AdminAccountOption[];
  emit('changeObject', selectedObjects);
}

function handleDropdownVisibleChange(open: boolean) {
  if (!open) {
    fetchAccountList();
  } else {
    mergeSelectedOptions();
  }
}

watch(modelValue, () => {
  if (props.multiple && modelValue.value === '') {
    modelValue.value = [];
    return;
  }
  mergeSelectedOptions();
});

onMounted(() => {
  fetchAccountList();
});
</script>

<template>
  <Select
    v-model:value="modelValue"
    allow-clear
    class="w-full"
    :disabled="disabled"
    :filter-option="false"
    :loading="loading"
    :mode="multiple ? 'multiple' : undefined"
    :options="selectOptions"
    placeholder="请选择账号"
    show-search
    @change="handleChange"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @search="handleSearch"
  />
</template>
