<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';

defineOptions({ name: 'PromoteDataSearch' });

const props = withDefaults(
  defineProps<{
    landingOptions?: Array<{
      label: string;
      value: number | string | undefined;
    }>;
    /** 可选日期跨度上限（天），对齐旧站 limit-number；0 表示不限制 */
    maxRangeDays?: number;
    showLanding?: boolean;
    showSearchButton?: boolean;
  }>(),
  {
    showLanding: false,
    showSearchButton: true,
    maxRangeDays: 0,
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

// 对齐旧站 getBeforeDateStr(7)：内部 days-1 → 近 7 个自然日（含今天）
const defaultBegin = dayjs().subtract(6, 'day');
const defaultEnd = dayjs();

const filterAdminIds = ref<Array<number | string>>([]);
const filterChannelIds = ref<Array<number | string>>([]);
const filterTemplateId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const rangeSelecting = ref<dayjs.Dayjs>();

function disabledDate(current: dayjs.Dayjs) {
  if (!props.maxRangeDays || !rangeSelecting.value) return false;
  const min = rangeSelecting.value.subtract(props.maxRangeDays, 'day');
  const max = rangeSelecting.value.add(props.maxRangeDays, 'day');
  return current.isBefore(min, 'day') || current.isAfter(max, 'day');
}

function onCalendarChange(
  dates: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  const first = dates?.[0];
  rangeSelecting.value = first
    ? dayjs.isDayjs(first)
      ? first
      : dayjs(first)
    : undefined;
}

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
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="filterAdminIds" style="width: 260px" />
      </Space.Compact>
    </div>
    <div class="flex flex-col gap-1">
      <Space.Compact>
        <span class="query-field-addon">渠道</span>
        <ChannelSelect v-model="filterChannelIds" style="width: 260px" placeholder="请输入渠道号" />
      </Space.Compact>
    </div>
    <Space.Compact>
      <span class="query-field-addon">落地页</span>
      <Select
        v-if="showLanding"
        v-model:value="filterTemplateId"
        allow-clear
        :options="landingOptions"
        show-search
        style="width: 180px"
        placeholder="请选择落地页"
      />
    </Space.Compact>
    <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="日期" precision="date" :disabled-date="disabledDate" />
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
