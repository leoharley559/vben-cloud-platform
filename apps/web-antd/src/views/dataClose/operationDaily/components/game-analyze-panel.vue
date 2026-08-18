<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchOperationDailyReportApi,
  fetchOperationDailyWinRankApi,
} from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import { num, percentText } from '../utils';

defineOptions({ name: 'GameAnalyzePanel' });

type Row = Record<string, unknown>;

const { iosAppStoreOptions, packageOptions, platformGameTypeMap } =
  useReportOptions();

const loading = ref(false);
const reportType = ref<1 | 2>(1);
const venueItems = ref<Row[]>([]);
const winPlayers = ref<Row[]>([]);
const losePlayers = ref<Row[]>([]);
const hourItems = ref<Row[]>([]);
const todayItems = ref<Row>({});
const filters = reactive({
  AdminIds: [] as Array<number | string>,
  AppUrl: [] as string[],
  ChannelIds: [] as Array<number | string>,
  PackageId: '' as number | string,
  beginDate: dayjs().subtract(1, 'day') as Dayjs,
  beforeDate: dayjs().subtract(2, 'day') as Dayjs,
});

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

const summaryItems = computed(() => {
  const t = todayItems.value;
  const win = -num(t.SumTransWinMoney1);
  return [
    { title: '投注金额', value: formatAmountFromCent(t.SumTransBetMoney1) },
    { title: '有效投注', value: formatAmountFromCent(t.SumTransBetValidMoney1) },
    { title: '派送金额', value: formatAmountFromCent(t.SumTransWinMoney1) },
    { title: '公司输赢', value: formatAmountFromCent(win) },
    {
      title: '盈利率',
      value: percentText(win, t.SumTransBetMoney1),
    },
    { title: '投注人数', value: num(t.SumTransBetNum1) },
  ];
});

const chartCategories = computed(() =>
  Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
);

const chartSeries = computed(() => [
  {
    data: chartCategories.value.map((_, hour) => {
      const row =
        hourItems.value.find(
          (item) => num(item.Hour ?? item.ReportHour) === hour,
        ) || {};
      return num(row.SumTransBetMoney1) / 100;
    }),
    name: '投注金额',
    type: 'line' as const,
  },
  {
    data: chartCategories.value.map((_, hour) => {
      const row =
        hourItems.value.find(
          (item) => num(item.Hour ?? item.ReportHour) === hour,
        ) || {};
      return -num(row.SumTransWinMoney1) / 100;
    }),
    name: '公司输赢',
    type: 'line' as const,
  },
]);

const venueColumns: TableColumnType<Row>[] = [
  {
    align: 'center',
    customRender: ({ record }) =>
      (platformGameTypeMap.value as Record<string, string>)[
        String(record.GameType)
      ] || String(record.GameType || '-'),
    key: 'GameType',
    title: '场馆',
  },
  {
    align: 'center',
    dataIndex: 'CountBetNum',
    key: 'CountBetNum',
    title: '投注人数',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumBet),
    key: 'SumBet',
    title: '投注额',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumValidWater),
    key: 'SumValidWater',
    title: '有效流水',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumBetWin),
    key: 'SumBetWin',
    title: '盈亏',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      percentText(num(record.SumBet) - num(record.SumWin), record.SumBet),
    key: 'Surplus',
    title: '盈利率',
  },
];

const playerColumns: TableColumnType<Row>[] = [
  {
    align: 'center',
    dataIndex: 'LoginAccount',
    key: 'LoginAccount',
    title: '游戏账号',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumBetWin),
    key: 'SumBetWin',
    title: '盈亏',
  },
];

function buildQuery() {
  const begin =
    reportType.value === 2
      ? filters.beginDate.format('YYYY-MM')
      : filters.beginDate.format('YYYY-MM-DD');
  const before =
    reportType.value === 2
      ? filters.beforeDate.format('YYYY-MM')
      : filters.beforeDate.format('YYYY-MM-DD');
  return {
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
    BeginTime: begin,
    BeforeTime: before,
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    PackageId: filters.PackageId || '',
    ReportType: reportType.value,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const query = buildQuery();
    const [report, rank] = await Promise.all([
      fetchOperationDailyReportApi(query),
      fetchOperationDailyWinRankApi(query),
    ]);
    todayItems.value = (report.TodayItems ||
      report.TodayBaseItems ||
      {}) as Row;
    hourItems.value = (report.TodayHourItems ||
      report.HourItems ||
      []) as Row[];
    const raw = rank.raw || {};
    venueItems.value = (raw.TodayGameTypeItems ||
      raw.TodayGameItems ||
      raw.GameItems ||
      []) as Row[];
    winPlayers.value = (raw.TodayPlayerItemsWin || []) as Row[];
    losePlayers.value = (raw.TodayPlayerItemsLose ||
      raw.TodayPlayerItemsLoss ||
      []) as Row[];
  } catch {
    todayItems.value = {};
    hourItems.value = [];
    venueItems.value = [];
    winPlayers.value = [];
    losePlayers.value = [];
    message.error('游戏分析加载失败');
  } finally {
    loading.value = false;
  }
}

function onReportTypeChange(value: 1 | 2) {
  reportType.value = value;
  if (value === 2) {
    filters.beginDate = dayjs().startOf('month');
    filters.beforeDate = dayjs().subtract(1, 'month').startOf('month');
  } else {
    filters.beginDate = dayjs().subtract(1, 'day');
    filters.beforeDate = dayjs().subtract(2, 'day');
  }
  void loadData();
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div>
    <ReportQueryCard title="游戏分析">
      <RadioGroup
        :value="reportType"
        button-style="solid"
        size="small"
        @update:value="onReportTypeChange"
      >
        <RadioButton :value="1">日报</RadioButton>
        <RadioButton :value="2">月报</RadioButton>
      </RadioGroup>
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="filters.AdminIds" class="min-w-[180px]" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filters.ChannelIds" class="min-w-[180px]" placeholder="请输入渠道号" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="filters.PackageId"
          :options="packageSelectOptions"
          allow-clear
          class="w-40"
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="filters.AppUrl"
          allow-clear
          class="min-w-[160px]"
          mode="multiple"
          :max-tag-count="1"
          :options="iosAppStoreOptions"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <DatePicker
        v-if="reportType === 1"
        v-model:value="filters.beginDate"
        placeholder="统计日"
      />
      <DatePicker
        v-if="reportType === 1"
        v-model:value="filters.beforeDate"
        placeholder="对比日"
      />
      <template v-else>
        <DatePicker
          v-model:value="filters.beginDate"
          picker="month"
          placeholder="当前月"
        />
        <DatePicker
          v-model:value="filters.beforeDate"
          picker="month"
          placeholder="对比月"
        />
      </template>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadData">
          查询
        </Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <div v-if="reportType === 1" class="mb-4">
      <ReportLineChart
        title="分时投注 / 输赢"
        :categories="chartCategories"
        :series="chartSeries"
        height="300px"
      />
    </div>

    <div class="mb-2 text-base font-medium">场馆盈亏</div>
    <Table
      :columns="venueColumns"
      :data-source="venueItems"
      :loading="loading"
      :pagination="false"
      bordered
      class="mb-4"
      row-key="GameType"
      size="small"
    />

    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <div class="mb-2 font-medium">大额盈利玩家</div>
        <Table
          :columns="playerColumns"
          :data-source="winPlayers"
          :pagination="false"
          bordered
          row-key="LoginAccount"
          size="small"
        />
      </div>
      <div>
        <div class="mb-2 font-medium">大额亏损玩家</div>
        <Table
          :columns="playerColumns"
          :data-source="losePlayers"
          :pagination="false"
          bordered
          row-key="LoginAccount"
          size="small"
        />
      </div>
    </div>
  </div>
</template>
