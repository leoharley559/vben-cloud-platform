<script lang="ts" setup>
import { ref } from 'vue';

import { Button, DatePicker, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';

defineOptions({ name: 'PromoteDataSearch' });

withDefaults(
  defineProps<{
    landingOptions?: Array<{
      label: string;
      value: number | string | undefined;
    }>;
    showLanding?: boolean;
    showSearchButton?: boolean;
  }>(),
  {
    showLanding: false,
    showSearchButton: true,
    landingOptions: () => [],
  },
);

const emit = defineEmits<{
  reset: [];
  search: [
    payload: {
      AdminIds: Array<number | string>;
      BeginTime: string;
      ChannelIds: Array<number | string>;
      EndTime: string;
      TemplateId: string;
    },
  ];
}>();

const defaultBegin = dayjs().subtract(7, 'day');
const defaultEnd = dayjs();

const filterAdminIds = ref<Array<number | string>>([]);
const filterChannelIds = ref<Array<number | string>>([]);
const filterTemplateId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

function buildPayload() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminIds: filterAdminIds.value,
    BeginTime: begin
      ? begin.format('YYYY-MM-DD')
      : defaultBegin.format('YYYY-MM-DD'),
    ChannelIds: filterChannelIds.value,
    EndTime: end ? end.format('YYYY-MM-DD') : defaultEnd.format('YYYY-MM-DD'),
    TemplateId: filterTemplateId.value,
  };
}

function handleSearch() {
  emit('search', buildPayload());
}

function handleReset() {
  filterAdminIds.value = [];
  filterChannelIds.value = [];
  filterTemplateId.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  emit('reset');
  emit('search', buildPayload());
}

defineExpose({
  buildPayload,
});
</script>

<template>
  <div class="query-panel">
    <div class="query-field">
      <span>推广账号</span>
      <AccountSelect v-model="filterAdminIds" style="width: 260px" />
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">渠道</span>
      <ChannelSelect v-model="filterChannelIds" style="width: 260px" />
    </div>
    <Select
      v-if="showLanding"
      v-model:value="filterTemplateId"
      allow-clear
      :options="landingOptions"
      placeholder="落地页"
      show-search
      style="width: 180px"
    />
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">日期</span>
      <DatePicker.RangePicker v-model:value="filterDateRange" />
    </div>
    <Space v-if="showSearchButton">
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </Space>
    <slot></slot>
  </div>
</template>

<style scoped>
.query-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 14px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-field {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
