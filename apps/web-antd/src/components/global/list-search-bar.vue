<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { ref, watch } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

export interface ListSearchOption {
  label: string;
  value: string;
}

export interface ListSearchParams {
  BeginTime: number | string;
  EndTime: number | string;
  Keyword: string;
  filterKey: string;
  filterValue: string;
}

defineOptions({ name: 'ListSearchBar' });

const props = withDefaults(
  defineProps<{
    addText?: string;
    dateLabel?: string;
    keywordPlaceholder?: string;
    loading?: boolean;
    options?: ListSearchOption[];
    showAdd?: boolean;
    /** 对齐旧站 SearchTypeTwo show-date-time，默认 true */
    showDateTime?: boolean;
    /** datetimerange | daterange，列表筛选默认仅日期 */
    dateTimeType?: 'daterange' | 'datetimerange';
  }>(),
  {
    addText: '新增',
    dateLabel: '时间',
    dateTimeType: 'daterange',
    keywordPlaceholder: '请输入',
    loading: false,
    options: () => [
      { label: '全部', value: 'All' },
      { label: '账号', value: 'Username' },
    ],
    showAdd: false,
    showDateTime: true,
  },
);

const emit = defineEmits<{
  add: [];
  reset: [];
  search: [params: ListSearchParams];
}>();

const filterKey = ref(props.options[0]?.value || 'All');
const filterValue = ref('');
const dateRange = ref<[Dayjs, Dayjs] | undefined>();

watch(
  () => props.options,
  (options) => {
    if (!options.some((item) => item.value === filterKey.value)) {
      filterKey.value = options[0]?.value || 'All';
    }
  },
  { deep: true },
);

function toUnix(value: Dayjs | undefined, edge: 'end' | 'start') {
  if (!value) return '';
  if (props.dateTimeType === 'daterange') {
    return edge === 'start' ? value.startOf('day').unix() : value.endOf('day').unix();
  }
  return value.unix();
}

function buildParams(): ListSearchParams {
  const value = filterValue.value.trim();
  const [begin, end] = dateRange.value || [];
  return {
    BeginTime: toUnix(begin, 'start'),
    EndTime: toUnix(end, 'end'),
    Keyword: value,
    filterKey: filterKey.value,
    filterValue: value,
  };
}

function handleSearch() {
  emit('search', buildParams());
}

function handleReset() {
  filterKey.value = props.options[0]?.value || 'All';
  filterValue.value = '';
  dateRange.value = undefined;
  emit('reset');
  emit('search', buildParams());
}

defineExpose({
  buildParams,
  reset: handleReset,
  search: handleSearch,
});
</script>

<template>
  <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
          <Space.Compact>
      <Select
        v-model:value="filterKey"
        :options="options"
      />
      <Input
        v-model:value="filterValue"
        allow-clear
        :placeholder="keywordPlaceholder"
        @press-enter="handleSearch"
      />
    </Space.Compact>

    <div v-if="showDateTime" class="query-filter-wide">
      <QueryDatetimeRangePicker
        v-model="dateRange"
        :label="dateLabel"
        :precision="dateTimeType === 'datetimerange' ? 'datetime' : 'date'"
      />
    </div>
        <div
          class="query-filter-actions"
          :class="{ 'query-filter-actions-single': !showAdd }"
        >
          <Button :loading="loading" type="primary" @click="handleSearch">查询</Button>
          <Button :disabled="loading" @click="handleReset">重置</Button>
          <Button v-if="showAdd" type="primary" @click="emit('add')">
            {{ addText }}
          </Button>
        </div>
    </div>
  </div>
</template>
