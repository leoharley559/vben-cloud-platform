<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, nextTick, ref, watch } from 'vue';

import { Button, Input, Space, TimePicker } from 'ant-design-vue';
import { onClickOutside } from '@vueuse/core';
import dayjs from 'dayjs';

defineOptions({ name: 'QueryDatetimeRangePicker' });

const props = withDefaults(
  defineProps<{
    disabledDate?: (current: Dayjs) => boolean;
    label?: string;
    /**
     * 对齐旧站 rangeDate2 limit-number：选中起始日后，另一端最多间隔 N 天。
     * 0 表示不限制。
     */
    maxRangeDays?: number;
    placeholder?: string;
    /** date=日历日；datetime=时分秒。按接口精度选择，不要混用。 */
    precision?: 'date' | 'datetime';
  }>(),
  {
    disabledDate: undefined,
    label: '时间范围',
    maxRangeDays: 0,
    placeholder: '请选择时间范围',
    precision: 'datetime',
  },
);

const modelValue = defineModel<[Dayjs, Dayjs] | undefined>();

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const DEFAULT_START_TIME = '00:00:00';
const DEFAULT_END_TIME = '23:59:59';

const open = ref(false);
const hoverDay = ref<Dayjs>();
const leftMonth = ref(dayjs().startOf('month'));
const rightMonth = computed(() => leftMonth.value.add(1, 'month'));

const draftStart = ref<Dayjs>();
const draftEnd = ref<Dayjs>();
const startDateText = ref('');
const endDateText = ref('');

const isDatetime = computed(() => props.precision === 'datetime');
const displayFormat = computed(() =>
  isDatetime.value ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD',
);

const displayStart = computed(() => {
  const begin = modelValue.value?.[0];
  return begin ? begin.format(displayFormat.value) : '';
});

const displayEnd = computed(() => {
  const end = modelValue.value?.[1];
  return end ? end.format(displayFormat.value) : '';
});

const triggerRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();
const overlayStyle = ref<Record<string, string>>({});

function updateOverlayPosition() {
  const rect = triggerRef.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }
  overlayStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
  };
}

watch(open, async (visible) => {
  if (visible) {
    syncDraftFromModel();
    await nextTick();
    updateOverlayPosition();
  }
});

onClickOutside(
  panelRef,
  () => {
    open.value = false;
  },
  { ignore: [triggerRef, '.ant-picker-dropdown'] },
);

function toggleOpen() {
  open.value = !open.value;
}

const allPresets = [
  {
    label: '今日',
    range: () => [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs],
  },
  {
    label: '昨日',
    range: () => {
      const day = dayjs().subtract(1, 'day');
      return [day.startOf('day'), day.endOf('day')] as [Dayjs, Dayjs];
    },
  },
  {
    label: '本月',
    range: () =>
      [dayjs().startOf('month'), dayjs().endOf('day')] as [Dayjs, Dayjs],
  },
  {
    label: '上月',
    range: () => {
      const lastMonth = dayjs().subtract(1, 'month');
      return [lastMonth.startOf('month'), lastMonth.endOf('month')] as [
        Dayjs,
        Dayjs,
      ];
    },
  },
];

const presets = computed(() => {
  if (!props.maxRangeDays) {
    return allPresets;
  }
  return allPresets.filter((item) => {
    const [begin, end] = item.range();
    return (
      end.startOf('day').diff(begin.startOf('day'), 'day') <= props.maxRangeDays
    );
  });
});

function isRangeTooLong(begin: Dayjs, end: Dayjs) {
  if (!props.maxRangeDays) {
    return false;
  }
  const [from, to] = begin.isAfter(end, 'day') ? [end, begin] : [begin, end];
  return to.startOf('day').diff(from.startOf('day'), 'day') > props.maxRangeDays;
}

function isDayDisabled(day: Dayjs) {
  if (props.disabledDate?.(day)) {
    return true;
  }
  if (
    !props.maxRangeDays ||
    !draftStart.value ||
    draftEnd.value
  ) {
    return false;
  }
  const min = draftStart.value.subtract(props.maxRangeDays, 'day');
  const max = draftStart.value.add(props.maxRangeDays, 'day');
  return day.isBefore(min, 'day') || day.isAfter(max, 'day');
}

function applyTime(date: Dayjs, time: Dayjs | string, fallback: string) {
  const clock = typeof time === 'string' ? dayjs(time, 'HH:mm:ss') : time;
  const source = clock?.isValid() ? clock : dayjs(fallback, 'HH:mm:ss');
  return date
    .hour(source.hour())
    .minute(source.minute())
    .second(source.second())
    .millisecond(0);
}

function syncDraftFromModel() {
  const [begin, end] = modelValue.value || [];
  draftStart.value = begin;
  draftEnd.value = end;
  startDateText.value = begin ? begin.format('YYYY-MM-DD') : '';
  endDateText.value = end ? end.format('YYYY-MM-DD') : '';
  leftMonth.value = (begin || dayjs()).startOf('month');
  hoverDay.value = undefined;
}

function syncDateTexts() {
  startDateText.value = draftStart.value
    ? draftStart.value.format('YYYY-MM-DD')
    : '';
  endDateText.value = draftEnd.value ? draftEnd.value.format('YYYY-MM-DD') : '';
}

function buildCells(month: Dayjs) {
  const first = month.startOf('month');
  const offset = (first.day() + 6) % 7;
  const start = first.subtract(offset, 'day');
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
}

function isSameDay(left?: Dayjs, right?: Dayjs) {
  return Boolean(left && right && left.isSame(right, 'day'));
}

function inHoverRange(day: Dayjs) {
  if (!draftStart.value || draftEnd.value || !hoverDay.value) {
    return false;
  }
  const start = draftStart.value;
  const hover = hoverDay.value;
  const [from, to] = start.isBefore(hover, 'day')
    ? [start, hover]
    : [hover, start];
  return day.isAfter(from, 'day') && day.isBefore(to, 'day');
}

function inSelectedRange(day: Dayjs) {
  if (!draftStart.value || !draftEnd.value) {
    return false;
  }
  return (
    day.isAfter(draftStart.value, 'day') && day.isBefore(draftEnd.value, 'day')
  );
}

function cellClass(day: Dayjs, month: Dayjs) {
  return {
    'is-disabled': isDayDisabled(day),
    'is-out': !day.isSame(month, 'month'),
    'is-start': isSameDay(day, draftStart.value),
    'is-end': isSameDay(day, draftEnd.value),
    'is-in-range': inSelectedRange(day) || inHoverRange(day),
    'is-today': day.isSame(dayjs(), 'day'),
  };
}

function pickDay(day: Dayjs) {
  if (isDayDisabled(day)) {
    return;
  }
  if (!draftStart.value || draftEnd.value) {
    draftStart.value = applyTime(day, draftStart.value || DEFAULT_START_TIME, DEFAULT_START_TIME);
    draftEnd.value = undefined;
    hoverDay.value = undefined;
    syncDateTexts();
    return;
  }

  if (day.isBefore(draftStart.value, 'day')) {
    draftEnd.value = applyTime(
      draftStart.value,
      draftEnd.value || DEFAULT_END_TIME,
      DEFAULT_END_TIME,
    );
    draftStart.value = applyTime(day, DEFAULT_START_TIME, DEFAULT_START_TIME);
  } else {
    draftEnd.value = applyTime(day, draftEnd.value || DEFAULT_END_TIME, DEFAULT_END_TIME);
  }
  hoverDay.value = undefined;
  syncDateTexts();
}

function parseDateInput(text: string, current?: Dayjs, fallbackTime?: string) {
  const parsed = dayjs(text, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    return current;
  }
  return applyTime(parsed, current || fallbackTime || DEFAULT_START_TIME, fallbackTime || DEFAULT_START_TIME);
}

function commitStartDate() {
  draftStart.value = parseDateInput(
    startDateText.value,
    draftStart.value,
    DEFAULT_START_TIME,
  );
  syncDateTexts();
}

function commitEndDate() {
  draftEnd.value = parseDateInput(
    endDateText.value,
    draftEnd.value,
    DEFAULT_END_TIME,
  );
  syncDateTexts();
}

function updateStartTime(value: Dayjs | null) {
  if (!value) {
    return;
  }
  const base = draftStart.value || dayjs();
  draftStart.value = applyTime(base, value, DEFAULT_START_TIME);
}

function updateEndTime(value: Dayjs | null) {
  if (!value) {
    return;
  }
  const base = draftEnd.value || draftStart.value || dayjs();
  draftEnd.value = applyTime(base, value, DEFAULT_END_TIME);
}

function applyPreset(range: () => [Dayjs, Dayjs]) {
  const [begin, end] = range();
  if (isRangeTooLong(begin, end)) {
    return;
  }
  modelValue.value = [begin, end];
  open.value = false;
}

function handleClear() {
  draftStart.value = undefined;
  draftEnd.value = undefined;
  startDateText.value = '';
  endDateText.value = '';
  hoverDay.value = undefined;
  modelValue.value = undefined;
  open.value = false;
}

function handleConfirm() {
  if (!draftStart.value || !draftEnd.value) {
    return;
  }
  const start = draftStart.value;
  const end = draftEnd.value;
  if (isRangeTooLong(start, end)) {
    return;
  }
  modelValue.value = start.isAfter(end) ? [end, start] : [start, end];
  open.value = false;
}

function shiftMonth(offset: number) {
  leftMonth.value = leftMonth.value.add(offset, 'month');
}

function shiftYear(offset: number) {
  leftMonth.value = leftMonth.value.add(offset, 'year');
}

function getPopupContainer(node: HTMLElement) {
  return node.closest('.query-datetime-range-panel') || document.body;
}
</script>

<template>
  <Space.Compact class="query-datetime-range-compact">
    <span v-if="label" class="query-field-addon">{{ label }}</span>
    <div
      ref="triggerRef"
      class="query-datetime-range"
      :class="{ 'is-date': !isDatetime, 'is-open': open }"
      @click="toggleOpen"
    >
      <template v-if="displayStart && displayEnd">
        <span class="range-part">{{ displayStart }}</span>
        <span class="range-sep">~</span>
        <span class="range-part">{{ displayEnd }}</span>
      </template>
      <span v-else class="range-placeholder">{{ placeholder }}</span>
    </div>
  </Space.Compact>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panelRef"
      class="query-datetime-range-dropdown"
      :style="overlayStyle"
    >
      <div class="query-datetime-range-panel">
        <aside class="query-datetime-range-presets">
          <button
            v-for="item in presets"
            :key="item.label"
            type="button"
            @click="applyPreset(item.range)"
          >
            {{ item.label }}
          </button>
        </aside>

        <div class="query-datetime-range-main">
          <div class="query-datetime-range-inputs">
            <Input
              v-model:value="startDateText"
              class="date-input"
              placeholder="开始日期"
              @blur="commitStartDate"
              @press-enter="commitStartDate"
            />
            <TimePicker
              v-if="isDatetime"
              :get-popup-container="getPopupContainer"
              :show-now="false"
              :value="draftStart"
              format="HH:mm:ss"
              placeholder="时分秒"
              @update:value="updateStartTime"
            />
            <span class="range-arrow">›</span>
            <Input
              v-model:value="endDateText"
              class="date-input"
              placeholder="结束日期"
              @blur="commitEndDate"
              @press-enter="commitEndDate"
            />
            <TimePicker
              v-if="isDatetime"
              :get-popup-container="getPopupContainer"
              :show-now="false"
              :value="draftEnd"
              format="HH:mm:ss"
              placeholder="时分秒"
              @update:value="updateEndTime"
            />
          </div>

          <div class="query-datetime-range-calendars">
            <section class="month-panel">
              <header class="month-header">
                <button type="button" @click="shiftYear(-1)">«</button>
                <button type="button" @click="shiftMonth(-1)">‹</button>
                <span>{{ leftMonth.format('YYYY年 M月') }}</span>
                <i></i>
                <i></i>
              </header>
              <div class="week-row">
                <span v-for="weekLabel in WEEKDAYS" :key="weekLabel">{{ weekLabel }}</span>
              </div>
              <div class="day-grid">
                <button
                  v-for="day in buildCells(leftMonth)"
                  :key="day.format('YYYY-MM-DD')"
                  class="day-cell"
                  :class="cellClass(day, leftMonth)"
                  :disabled="isDayDisabled(day)"
                  type="button"
                  @click="pickDay(day)"
                  @mouseenter="hoverDay = day"
                >
                  <span>{{ day.date() }}</span>
                </button>
              </div>
            </section>
            <section class="month-panel">
              <header class="month-header">
                <i></i>
                <i></i>
                <span>{{ rightMonth.format('YYYY年 M月') }}</span>
                <button type="button" @click="shiftMonth(1)">›</button>
                <button type="button" @click="shiftYear(1)">»</button>
              </header>
              <div class="week-row">
                <span v-for="weekLabel in WEEKDAYS" :key="`r-${weekLabel}`">{{ weekLabel }}</span>
              </div>
              <div class="day-grid">
                <button
                  v-for="day in buildCells(rightMonth)"
                  :key="day.format('YYYY-MM-DD')"
                  class="day-cell"
                  :class="cellClass(day, rightMonth)"
                  :disabled="isDayDisabled(day)"
                  type="button"
                  @click="pickDay(day)"
                  @mouseenter="hoverDay = day"
                >
                  <span>{{ day.date() }}</span>
                </button>
              </div>
            </section>
          </div>

          <div class="query-datetime-range-footer">
            <Button type="link" @click="handleClear">清空</Button>
            <Button @click="handleConfirm">确定</Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.query-datetime-range-dropdown {
  position: fixed;
  z-index: 1050;
  overflow: visible;
  color: hsl(var(--foreground));
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 6px 16px hsl(var(--foreground) / 12%);
}

.query-datetime-range-compact.ant-space-compact {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
}

.query-datetime-range-compact .query-field-addon {
  min-height: var(--ant-control-height, 32px);
}

.query-datetime-range-compact .query-datetime-range:first-child {
  border-start-start-radius: 8px;
  border-end-start-radius: 8px;
}

.query-datetime-range {
  box-sizing: border-box;
  display: inline-flex;
  flex: none !important;
  gap: 8px;
  align-items: center;
  width: max-content;
  min-width: 360px;
  height: var(--ant-control-height, 32px);
  padding: 0 11px;
  color: hsl(var(--foreground) / 88%);
  font-size: 14px;
  line-height: 1.5714285714285714;
  white-space: nowrap;
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-start-end-radius: 8px;
  border-end-end-radius: 8px;
  cursor: pointer;
}

.query-datetime-range.is-date {
  min-width: 240px;
}

.query-datetime-range:hover,
.query-datetime-range.is-open {
  z-index: 2;
  border-color: hsl(var(--primary));
}

.query-datetime-range.is-open {
  box-shadow: 0 0 0 2px hsl(var(--primary) / 12%);
}

.query-datetime-range .range-part {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: nowrap;
}

.query-datetime-range .range-sep {
  color: hsl(var(--foreground) / 45%);
}

.query-datetime-range .range-placeholder {
  color: hsl(var(--foreground) / 35%);
}

.query-datetime-range-panel {
  position: relative;
  display: flex;
  overflow: visible;
  background: hsl(var(--popover));
}

.query-datetime-range-presets {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 108px;
  padding: 8px 0;
  border-right: 1px solid hsl(var(--border));
}

.query-datetime-range-presets button {
  padding: 6px 16px;
  color: hsl(var(--primary));
  font-size: 13px;
  line-height: 22px;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.query-datetime-range-presets button:hover {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
}

.query-datetime-range-main {
  padding: 8px 12px 10px;
}

.query-datetime-range-inputs {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.query-datetime-range-inputs .date-input {
  width: 112px;
}

.query-datetime-range-inputs .ant-picker {
  width: 108px;
}

.query-datetime-range-inputs .range-arrow {
  color: hsl(var(--foreground) / 45%);
  font-size: 16px;
}

.query-datetime-range-calendars {
  display: flex;
  gap: 16px;
}

.month-panel {
  width: 252px;
}

.month-header {
  display: grid;
  grid-template-columns: 24px 24px 1fr 24px 24px;
  gap: 4px;
  align-items: center;
  height: 36px;
  font-weight: 500;
}

.month-header span {
  text-align: center;
}

.month-header button {
  width: 24px;
  color: hsl(var(--foreground) / 65%);
  font-size: 14px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.week-row,
.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.week-row span,
.day-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 13px;
}

.week-row span {
  color: hsl(var(--foreground) / 55%);
}

.day-cell {
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.day-cell.is-disabled {
  color: hsl(var(--foreground) / 25%);
  cursor: not-allowed;
  pointer-events: none;
}

.day-cell span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.day-cell.is-out {
  color: hsl(var(--foreground) / 30%);
}

.day-cell.is-today span {
  font-weight: 600;
  border: 1px solid hsl(var(--primary) / 45%);
}

.day-cell.is-in-range {
  background: hsl(var(--primary) / 10%);
}

.day-cell.is-start,
.day-cell.is-end {
  background: hsl(var(--primary) / 10%);
}

.day-cell.is-start span,
.day-cell.is-end span {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.query-datetime-range-footer {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
