<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';

export interface ListSearchOption {
  label: string;
  value: string;
}

export interface ListSearchParams {
  filterKey: string;
  filterValue: string;
  Keyword: string;
}

defineOptions({ name: 'ListSearchBar' });

const props = withDefaults(
  defineProps<{
    addText?: string;
    keywordPlaceholder?: string;
    loading?: boolean;
    options?: ListSearchOption[];
    showAdd?: boolean;
  }>(),
  {
    addText: '新增',
    keywordPlaceholder: '请输入关键词',
    loading: false,
    options: () => [
      { label: '全部', value: 'All' },
      { label: '账号', value: 'Username' },
    ],
    showAdd: false,
  },
);

const emit = defineEmits<{
  add: [];
  reset: [];
  search: [params: ListSearchParams];
}>();

const filterKey = ref(props.options[0]?.value || 'All');
const filterValue = ref('');

function buildParams(): ListSearchParams {
  const value = filterValue.value.trim();
  return {
    filterKey: filterKey.value,
    filterValue: value,
    Keyword: value,
  };
}

function handleSearch() {
  emit('search', buildParams());
}

function handleReset() {
  filterKey.value = props.options[0]?.value || 'All';
  filterValue.value = '';
  emit('reset');
  emit('search', buildParams());
}
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <Space.Compact>
      <Select
        v-model:value="filterKey"
        :options="options"
        style="width: 120px"
      />
      <Input
        v-model:value="filterValue"
        allow-clear
        :placeholder="keywordPlaceholder"
        style="width: 240px"
        @press-enter="handleSearch"
      />
    </Space.Compact>

    <Button :loading="loading" type="primary" @click="handleSearch">
      查询
    </Button>
    <Button @click="handleReset">重置</Button>
    <Button v-if="showAdd" type="primary" @click="emit('add')">
      {{ addText }}
    </Button>
  </div>
</template>
