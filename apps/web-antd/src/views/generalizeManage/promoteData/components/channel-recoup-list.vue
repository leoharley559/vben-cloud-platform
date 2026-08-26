<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { ChannelRecoupItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  message,
  Radio,
  Result,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchChannelRecoupListApi } from '#/api/promotion/promote-data';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'ChannelRecoupList' });

interface RecoupRow extends ChannelRecoupItem {
  _periodIndex?: number;
  _periodStart?: number;
  _periodYear?: number;
}

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(13_187));
const canExport = computed(() => checkPermission(10_016));
const dayLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 21, 28, 30];
const rows = ref<RecoupRow[]>([]);
const loading = ref(false);
const exportLoading = ref(false);
const filterAdminIds = ref<Array<number | string>>([]);
const filterAdminSearch = ref('');
const filterAdminSearchType = ref(0);
const filterChannelIds = ref<Array<number | string>>([]);
const filterChannelSearch = ref('');
const filterChannelSearchType = ref(0);
const filterReportType = ref(4);
const filterType = ref(1);
const filterIsTotal = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(currentMonth());
const currentDateNum = ref(new Date().getMonth() + 1);
const currentYear = ref(new Date().getFullYear());

function currentWeek(): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();
  const daysFromMonday = (now.day() + 6) % 7;
  const monday = now.subtract(daysFromMonday, 'day').startOf('day');
  return [monday, monday.add(6, 'day')];
}

/** 默认当月（月报模式下两端均为当月） */
function currentMonth(): [dayjs.Dayjs, dayjs.Dayjs] {
  const month = dayjs().startOf('month');
  return [month, month];
}

/** 对齐旧站 getWeekNumber（ISO 周） */
function getWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

const datePickerMode = computed<'date' | 'month' | 'week'>(() =>
  filterReportType.value === 4
    ? 'month'
    : (filterReportType.value === 3
      ? 'week'
      : 'date'),
);

function resetDateByReportType() {
  if (filterReportType.value === 2) {
    // 对齐旧站 getBeforeDateStr(30/1) → [today-29, today]
    filterDateRange.value = [dayjs().subtract(29, 'day'), dayjs()];
    currentDateNum.value = Date.now();
  } else if (filterReportType.value === 3) {
    filterDateRange.value = currentWeek();
    currentDateNum.value = getWeekNumber(new Date());
  } else {
    // 对齐旧站 getBeforeMonthStr(120/1)+'-01'
    const beginMonth = dayjs().subtract(119, 'day').startOf('month');
    filterDateRange.value = [beginMonth, dayjs().startOf('month')];
    currentDateNum.value = new Date().getMonth() + 1;
  }
  currentYear.value = new Date().getFullYear();
  rows.value = [];
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  const adminSearch =
    filterAdminSearchType.value === 0
      ? filterAdminIds.value.join(',')
      : filterAdminSearch.value.trim();
  const channelSearch =
    filterChannelSearchType.value === 0
      ? filterChannelIds.value.join(',')
      : filterChannelSearch.value.trim();
  return {
    AdminSearch: adminSearch,
    AdminSearchType: filterAdminSearchType.value,
    BeginTime: begin?.format('YYYY-MM-DD') || '',
    ChannelSearch: channelSearch,
    ChannelSearchType: filterChannelSearchType.value,
    EndTime: end?.format('YYYY-MM-DD') || '',
    IsTotal: Boolean(filterIsTotal.value),
    ReportType: filterReportType.value,
    Type: filterType.value,
  };
}

function enrichRows(items: ChannelRecoupItem[]): RecoupRow[] {
  return items.map((item) => {
    const row: RecoupRow = { ...item };
    if (filterReportType.value === 2) {
      row._periodStart = new Date(String(item.RegisterPeriod || '')).getTime();
    } else {
      const parts = String(item.RegisterPeriod || '').split('-');
      row._periodYear = Number(parts[0] || 0);
      row._periodIndex = Number(parts[1] || 0);
    }
    return row;
  });
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchChannelRecoupListApi(getQueryParams());
    rows.value = enrichRows(result.Items || []);
  } catch {
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  filterAdminIds.value = [];
  filterAdminSearch.value = '';
  filterAdminSearchType.value = 0;
  filterChannelIds.value = [];
  filterChannelSearch.value = '';
  filterChannelSearchType.value = 0;
  filterReportType.value = 4;
  filterType.value = 1;
  filterIsTotal.value = 0;
  filterDateRange.value = currentMonth();
  currentDateNum.value = new Date().getMonth() + 1;
  currentYear.value = new Date().getFullYear();
  loadData();
}

function periodLabel(index: number) {
  if (index === 1) {
    return filterReportType.value === 2
      ? '当日'
      : (filterReportType.value === 3
        ? '本周'
        : '本月');
  }
  return filterReportType.value === 2
    ? `第${index}日`
    : (filterReportType.value === 3
      ? `第${index}周`
      : `第${index}月`);
}

function reportDate(value?: string) {
  if (!value) return '-';
  if (filterReportType.value !== 3) return value;
  const [year, week] = value.split('-');
  return `${year}年第${week}周`;
}

function rowArray(row: RecoupRow) {
  const suffix = filterIsTotal.value ? 'Total' : '';
  const fieldMap: Record<number, string> = {
    1: 'SumBetNum',
    2: 'WinLoseMoney',
    3: 'SumPayWithdrawDiffMoney',
    4: 'SumPayMergerMoney',
    5: 'SumPayNum',
  };
  const field = `${fieldMap[filterType.value] || 'SumBetNum'}${suffix}`;
  const value = row[field as keyof RecoupRow];
  return Array.isArray(value) ? value : [];
}

/** 对齐旧站 formatValue：未到期周期显示 '-' */
function isPastPeriod(row: RecoupRow, index: number, dayReportIndex = 1) {
  if (filterReportType.value === 2) {
    const start = Number(row._periodStart || 0);
    return start + dayReportIndex * 86_400_000 < currentDateNum.value;
  }
  const period = Number(row._periodIndex || 0);
  const year = Number(row._periodYear || 0);
  return period + index < currentDateNum.value || year < currentYear.value;
}

function dynamicValue(row: RecoupRow, index: number) {
  const dayReportIndex =
    filterReportType.value === 2 ? dayLabels[index] || 1 : 1;
  if (!isPastPeriod(row, index, dayReportIndex)) {
    return '-';
  }
  const value = rowArray(row)[index];
  if (value === undefined || value === null) return '-';
  return [2, 3, 4].includes(filterType.value)
    ? formatAmountFromCent(Number(value))
    : value;
}

function dynamicRawValue(row: RecoupRow, index: number) {
  const dayReportIndex =
    filterReportType.value === 2 ? dayLabels[index] || 1 : 1;
  if (!isPastPeriod(row, index, dayReportIndex)) {
    return 0;
  }
  return Number(rowArray(row)[index] || 0);
}

const dynamicLabels = computed(() =>
  filterReportType.value === 2
    ? dayLabels
    : Array.from({ length: 12 }, (_, index) => index + 1),
);

const columns = computed<TableColumnsType<RecoupRow>>(() => [
  {
    dataIndex: 'RegisterPeriod',
    fixed: 'left',
    key: 'date',
    title: '日期',
    width: 130,
  },
  {
    dataIndex: 'RegNum',
    fixed: 'left',
    key: 'RegNum',
    title: '注册人数',
    width: 100,
  },
  {
    dataIndex: 'FirstPayNum',
    fixed: 'left',
    key: 'FirstPayNum',
    title: '首存人数',
    width: 100,
  },
  ...dynamicLabels.value.map((label, index) => ({
    key: `period-${index}`,
    title: periodLabel(label),
    width: 100,
  })),
]);

async function handleExport() {
  if (rows.value.length === 0) {
    message.info('暂无可导出数据');
    return;
  }
  exportLoading.value = true;
  try {
    exportRowsToCsv(
      rows.value,
      [
        { header: '日期', value: (row) => reportDate(row.RegisterPeriod) },
        { header: '注册人数', value: (row) => row.RegNum ?? 0 },
        { header: '首存人数', value: (row) => row.FirstPayNum ?? 0 },
        ...dynamicLabels.value.map((label, index) => ({
          header: periodLabel(label),
          value: (row: RecoupRow) => dynamicValue(row, index),
        })),
      ],
      `渠道回本数据_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
    message.success('导出成功');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) loadData();
});
</script>

<template>
  <div v-if="canViewPage">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Space.Compact>
          <Select
            class="query-auto-select"
            :popup-match-select-width="false"
            v-model:value="filterAdminSearchType"
            :options="[
              { label: '账号模糊', value: 0 },
              { label: '账号精准', value: 1 },
            ]"
          />
          <AccountSelect
            v-if="filterAdminSearchType === 0"
            v-model="filterAdminIds"
          />
          <Input
            v-else
            v-model:value="filterAdminSearch"
            allow-clear
            placeholder="请输入推广账号"
          />
        </Space.Compact>
        <Space.Compact>
          <Select
            class="query-auto-select"
            :popup-match-select-width="false"
            v-model:value="filterChannelSearchType"
            :options="[
              { label: '渠道模糊', value: 0 },
              { label: '渠道精准', value: 1 },
            ]"
          />
          <ChannelSelect
            v-if="filterChannelSearchType === 0"
            v-model="filterChannelIds"
            placeholder="请输入渠道号"
          />
          <Input
            v-else
            v-model:value="filterChannelSearch"
            allow-clear
            placeholder="请输入渠道"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">报表类型</span>
          <Select
            v-model:value="filterReportType"
            :options="[
              { label: '日报', value: 2 },
              { label: '周报', value: 3 },
              { label: '月报', value: 4 },
            ]"
            placeholder="请选择报表类型"
            @change="resetDateByReportType"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <Space.Compact>
            <span class="query-field-addon">时间范围</span>
            <DatePicker.RangePicker
              v-model:value="filterDateRange"
              :picker="datePickerMode"
            />
          </Space.Compact>
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="loadData">查询</Button>
          <Button @click="reset">重置</Button>
        </div>
      </div>
    </div>
    <div class="recoup-toolbar">
      <Space wrap>
        <Radio.Group v-model:value="filterType" button-style="solid">
          <Radio.Button :value="1">投注人数</Radio.Button>
          <Radio.Button :value="2">公司输赢</Radio.Button>
          <Radio.Button :value="3">充提差</Radio.Button>
          <Radio.Button :value="4">充值</Radio.Button>
          <Radio.Button :value="5">充值人数</Radio.Button>
        </Radio.Group>
        <Select
          v-model:value="filterIsTotal"
          class="query-auto-select"
          :options="[
            { label: '不累计', value: 0 },
            { label: '累计', value: 1 },
          ]"
        />
      </Space>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出 Excel
      </Button>
    </div>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => String(row.RegisterPeriod)"
      :scroll="{ x: 1600 }"
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <span v-if="column.key === 'date'">
          {{ reportDate(record.RegisterPeriod) }}
        </span>
        <span
          v-else-if="String(column.key).startsWith('period-')"
          :class="{
            'positive-value':
              dynamicRawValue(
                record,
                Number(String(column.key).replace('period-', '')),
              ) > 0,
            'negative-value':
              dynamicRawValue(
                record,
                Number(String(column.key).replace('period-', '')),
              ) < 0,
          }"
        >
          {{
            dynamicValue(
              record,
              Number(String(column.key).replace('period-', '')),
            )
          }}
        </span>
        <span v-else-if="column.key === 'RegNum'">{{ record.RegNum }}</span>
        <span v-else-if="column.key === 'FirstPayNum'">
          {{ record.FirstPayNum }}
        </span>
      </template>
    </Table>
  </div>
  <Result v-else status="403" sub-title="无渠道回本数据查看权限" title="403" />
</template>

<style scoped>
.recoup-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.positive-value {
  color: #389e0d;
}

.negative-value {
  color: #cf1322;
}
</style>
