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
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'ChannelRecoupList' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(13_187));
const canExport = computed(() => checkPermission(10_016));
const dayLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 21, 28, 30];
const rows = ref<ChannelRecoupItem[]>([]);
const loading = ref(false);
const exportLoading = ref(false);
const filterAdminSearch = ref('');
const filterAdminSearchType = ref(0);
const filterChannelSearch = ref('');
const filterChannelSearchType = ref(0);
const filterReportType = ref(3);
const filterType = ref(1);
const filterIsTotal = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(currentWeek());

function currentWeek(): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();
  const daysFromMonday = (now.day() + 6) % 7;
  const monday = now.subtract(daysFromMonday, 'day').startOf('day');
  return [monday, monday.add(6, 'day')];
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
    filterDateRange.value = [
      dayjs().subtract(30, 'day'),
      dayjs().subtract(1, 'day'),
    ];
  } else if (filterReportType.value === 3) {
    filterDateRange.value = currentWeek();
  } else {
    filterDateRange.value = [
      dayjs().subtract(120, 'month').startOf('month'),
      dayjs().subtract(1, 'month').startOf('month'),
    ];
  }
  rows.value = [];
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminSearch: filterAdminSearch.value.trim(),
    AdminSearchType: filterAdminSearchType.value,
    BeginTime: begin?.format('YYYY-MM-DD') || '',
    ChannelSearch: filterChannelSearch.value.trim(),
    ChannelSearchType: filterChannelSearchType.value,
    EndTime: end?.format('YYYY-MM-DD') || '',
    IsTotal: Boolean(filterIsTotal.value),
    ReportType: filterReportType.value,
    Type: filterType.value,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchChannelRecoupListApi(getQueryParams());
    rows.value = result.Items || [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  filterAdminSearch.value = '';
  filterAdminSearchType.value = 0;
  filterChannelSearch.value = '';
  filterChannelSearchType.value = 0;
  filterReportType.value = 3;
  filterType.value = 1;
  filterIsTotal.value = 0;
  filterDateRange.value = currentWeek();
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

function rowArray(row: ChannelRecoupItem) {
  const suffix = filterIsTotal.value ? 'Total' : '';
  const fieldMap: Record<number, string> = {
    1: 'SumBetNum',
    2: 'WinLoseMoney',
    3: 'SumPayWithdrawDiffMoney',
    4: 'SumPayMergerMoney',
    5: 'SumPayNum',
  };
  const field = `${fieldMap[filterType.value] || 'SumBetNum'}${suffix}`;
  const value = row[field];
  return Array.isArray(value) ? value : [];
}

function dynamicValue(row: ChannelRecoupItem, index: number) {
  const value = rowArray(row)[index];
  if (value === undefined || value === null) return '-';
  return [2, 3, 4].includes(filterType.value)
    ? formatAmountFromCent(Number(value))
    : value;
}

function dynamicRawValue(row: ChannelRecoupItem, index: number) {
  return Number(rowArray(row)[index] || 0);
}

const dynamicLabels = computed(() =>
  filterReportType.value === 2
    ? dayLabels
    : Array.from({ length: 12 }, (_, index) => index + 1),
);

const columns = computed<TableColumnsType<ChannelRecoupItem>>(() => [
  { dataIndex: 'RegisterPeriod', fixed: 'left', key: 'date', title: '日期', width: 130 },
  { dataIndex: 'RegNum', fixed: 'left', key: 'RegNum', title: '注册人数', width: 100 },
  { dataIndex: 'FirstPayNum', fixed: 'left', key: 'FirstPayNum', title: '首存人数', width: 100 },
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
          value: (row: ChannelRecoupItem) => dynamicValue(row, index),
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
    <div class="recoup-query">
      <Space.Compact>
        <Select
          v-model:value="filterAdminSearchType"
          :options="[
            { label: '模糊', value: 0 },
            { label: '精确', value: 1 },
          ]"
          style="width: 80px"
        />
        <Input
          v-model:value="filterAdminSearch"
          allow-clear
          placeholder="推广账号"
          style="width: 180px"
        />
      </Space.Compact>
      <Space.Compact>
        <Select
          v-model:value="filterChannelSearchType"
          :options="[
            { label: '模糊', value: 0 },
            { label: '精确', value: 1 },
          ]"
          style="width: 80px"
        />
        <Input
          v-model:value="filterChannelSearch"
          allow-clear
          placeholder="渠道"
          style="width: 180px"
        />
      </Space.Compact>
      <Select
        v-model:value="filterReportType"
        :options="[
          { label: '日报', value: 2 },
          { label: '周报', value: 3 },
          { label: '月报', value: 4 },
        ]"
        style="width: 100px"
        @change="resetDateByReportType"
      />
      <DatePicker.RangePicker
        v-model:value="filterDateRange"
        :picker="datePickerMode"
      />
      <Button type="primary" @click="loadData">查询</Button>
      <Button @click="reset">重置</Button>
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
          :options="[
            { label: '不累计', value: 0 },
            { label: '累计', value: 1 },
          ]"
          style="width: 100px"
        />
      </Space>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExport"
      >
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
.recoup-query,
.recoup-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px;
  margin-bottom: 12px;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.recoup-toolbar {
  justify-content: space-between;
  background: transparent;
}

.positive-value {
  color: #389e0d;
}

.negative-value {
  color: #cf1322;
}
</style>
