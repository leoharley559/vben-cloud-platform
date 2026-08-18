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
  fetchOperationIncomeAnalyzeApi,
} from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import {
  calcCompanyIncome,
  calcCompanyWin,
  calcOperatingCost,
  durationText,
  num,
  percentText,
  pickTwoDayItem,
} from '../utils';

defineOptions({ name: 'OperationDailyPanel' });

type Row = Record<string, unknown>;

const CONTRAST_OPTIONS = [
  { label: '前1天', value: 1 },
  { label: '前30天', value: 2 },
  { label: '上周同期', value: 3 },
  { label: '上月同期', value: 4 },
  { label: '上季度同期', value: 5 },
  { label: '上年同期', value: 6 },
];

const { checkPermission } = useCloudPermission();
const { iosAppStoreOptions, packageOptions, platformGameTypeMap } =
  useReportOptions();

const loading = ref(false);
const reportType = ref<1 | 2>(1);
const dataSearchType = ref(0);
const filters = reactive({
  AdminIds: [] as Array<number | string>,
  AppUrl: [] as string[],
  ChannelIds: [] as Array<number | string>,
  PackageId: '' as number | string,
  beginDate: dayjs().subtract(1, 'day') as Dayjs,
  beforeDate: dayjs().subtract(2, 'day') as Dayjs,
  compareType: 1 as '' | number,
});

const todayItems = ref<Row>({});
const beforeItems = ref<Row>({});
const hourItems = ref<Row[]>([]);
const beforeHourItems = ref<Row[]>([]);
const venueItems = ref<Row[]>([]);
const winPlayers = ref<Row[]>([]);
const losePlayers = ref<Row[]>([]);
const incomeData = ref<Row>({});
const lineMetric = ref('SumPayMergerMoney');

const canIncome = computed(() => checkPermission(11_226));
const canWin = computed(() => checkPermission(11_227));
const canGame = computed(() => checkPermission(11_228));
const canTopup = computed(() => checkPermission(11_229));

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

const lineMetrics = [
  { key: 'SumPayMergerMoney', label: '存款金额' },
  { key: 'SumWithdrawMoney', label: '取款金额' },
  { key: 'SumTransBetMoney1', label: '投注金额' },
  { key: 'SumTransBetValidMoney1', label: '有效投注金额' },
  { key: 'SumReg', label: '注册人数' },
  { key: 'SumPayMergerNum', label: '存款人数' },
  { key: 'SumWithdrawNum', label: '取款人数' },
  { key: 'SumTransBetNum1', label: '投注人数' },
];

const moneyMetrics = new Set([
  'SumPayMergerMoney',
  'SumTransBetMoney1',
  'SumTransBetValidMoney1',
  'SumWithdrawMoney',
]);

const summaryItems = computed(() => {
  const t = todayItems.value;
  const items: Array<{ title: string; value: number | string }> = [];
  if (canIncome.value) {
    items.push({
      title: '公司收入',
      value: formatAmountFromCent(calcCompanyIncome(t)),
    });
  }
  if (canWin.value) {
    items.push(
      {
        title: '公司总输赢',
        value: formatAmountFromCent(calcCompanyWin(t)),
      },
      {
        title: '盈利率',
        value: percentText(calcCompanyWin(t), t.SumTransBetMoney1),
      },
      {
        title: '兑存率',
        value: percentText(t.SumWithdrawMoney, t.SumPayMergerMoney),
      },
      {
        title: '注册转化率',
        value: percentText(t.SumFirstPayNum, t.SumReg),
      },
      {
        title: '运营总成本',
        value: formatAmountFromCent(calcOperatingCost(t)),
      },
    );
  }
  return items;
});

const chartCategories = computed(() =>
  Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
);

const chartSeries = computed(() => {
  const metric = lineMetric.value;
  const pick = (list: Row[]) =>
    chartCategories.value.map((_, hour) => {
      const row =
        list.find((item) => num(item.Hour ?? item.ReportHour) === hour) || {};
      const value = num(row[metric]);
      return moneyMetrics.has(metric) ? value / 100 : value;
    });
  return [
    { data: pick(hourItems.value), name: '当日', type: 'line' as const },
    {
      data: pick(beforeHourItems.value),
      name: '对比日',
      type: 'line' as const,
    },
  ];
});

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

const kpiCards = computed(() => {
  const t = todayItems.value;
  if (!canWin.value) return [];
  return [
    { title: '登录人数', value: num(t.SumLogin) },
    { title: '访客人数', value: num(t.SumDevice) },
    { title: '注册人数', value: num(t.SumReg) },
    { title: '首存人数', value: num(t.SumFirstPayNum) },
    { title: '投注人数', value: num(t.SumTransBetNum1) },
    {
      title: '投注人数占比',
      value: percentText(t.SumTransBetNum1, t.SumLogin),
    },
    {
      title: '充值平均时长',
      value: durationText(t.AvgPayTime || t.PayAvgTime),
    },
    {
      title: '兑换平均时长',
      value: durationText(t.AvgWithdrawTime || t.WithdrawAvgTime),
    },
    {
      title: '风控审核平均时长',
      value: durationText(t.AvgRiskTime || t.RiskAvgTime),
    },
    {
      title: '财务平均时长',
      value: durationText(t.AvgFinanceTime || t.FinanceAvgTime),
    },
    {
      title: '三方平均时长',
      value: durationText(t.AvgThirdTime || t.ThirdAvgTime),
    },
  ];
});

/** 对齐旧版 dateCut：按对比类型推算对比日 */
function applyCompareType() {
  const begin = filters.beginDate;
  const type = Number(filters.compareType) || 1;
  switch (type) {
    case 2: {
      filters.beforeDate = begin.subtract(30, 'day');
      break;
    }
    case 3: {
      filters.beforeDate = begin.subtract(7, 'day');
      break;
    }
    case 4: {
      filters.beforeDate = begin.subtract(1, 'month');
      break;
    }
    case 5: {
      filters.beforeDate = begin.subtract(3, 'month');
      break;
    }
    case 6: {
      filters.beforeDate = begin.subtract(1, 'year');
      break;
    }
    default: {
      filters.beforeDate = begin.subtract(1, 'day');
    }
  }
}

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
    BeginTime: begin,
    BeforeTime: before,
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
    DataSearchType: dataSearchType.value,
    PackageId: filters.PackageId || '',
    ContrastType: filters.compareType || '',
    ReportType: reportType.value,
  };
}

function pickToday(data: Row) {
  // dayreport 主指标在 TodayItems（对象）；勿回落到整个 respond
  if (data.TodayItems && typeof data.TodayItems === 'object') {
    return data.TodayItems as Row;
  }
  const items = data.TwoDayBaseItems;
  if (Array.isArray(items)) {
    const day =
      reportType.value === 2
        ? filters.beginDate.format('YYYY-MM')
        : filters.beginDate.format('YYYY-MM-DD');
    return (
      items.find((item: Row) => String(item.ReportDay || '') === day) ||
      items[0] ||
      {}
    );
  }
  return {};
}

async function loadData() {
  loading.value = true;
  try {
    const query = buildQuery();
    const tasks: Promise<void>[] = [];

    if (canIncome.value || canWin.value) {
      tasks.push(
        fetchOperationDailyReportApi(query).then((data) => {
          todayItems.value = pickToday(data as Row);
          beforeItems.value = (data.BeforeItems ||
            data.BeforeBaseItems ||
            data.YestDayItems ||
            {}) as Row;
          hourItems.value = (data.TodayHourItems ||
            data.HourItems ||
            []) as Row[];
          beforeHourItems.value = (data.BeforeHourItems ||
            data.YestHourItems ||
            []) as Row[];
        }),
      );
    }

    if (canGame.value) {
      tasks.push(
        fetchOperationDailyWinRankApi(query).then((result) => {
          const raw = result.raw || {};
          venueItems.value = (raw.TodayGameTypeItems ||
            raw.TodayGameItems ||
            raw.GameItems ||
            []) as Row[];
          winPlayers.value = (raw.TodayPlayerItemsWin || []) as Row[];
          losePlayers.value = (raw.TodayPlayerItemsLose ||
            raw.TodayPlayerItemsLoss ||
            []) as Row[];
        }),
      );
    }

    if (canTopup.value) {
      tasks.push(
        fetchOperationIncomeAnalyzeApi({
          // 对齐旧站 topUpDetails：Begin=统计日，End/Before=对比日
          BeginTime: query.BeginTime,
          EndTime: query.BeforeTime,
          ChannelIds: query.ChannelIds,
          AdminIds: query.AdminIds,
          AppUrl: query.AppUrl,
          PackageId: query.PackageId,
          ReportType: query.ReportType,
        }).then((data) => {
          incomeData.value = pickTwoDayItem(
            data as Row,
            String(query.BeginTime),
          );
        }),
      );
    }

    if (tasks.length === 0) {
      message.warning('无运营日报子模块权限（11226–11229）');
    } else {
      await Promise.all(tasks);
    }
  } catch {
    todayItems.value = {};
    beforeItems.value = {};
    hourItems.value = [];
    beforeHourItems.value = [];
    venueItems.value = [];
    winPlayers.value = [];
    losePlayers.value = [];
    incomeData.value = {};
    message.error('运营日报加载失败');
  } finally {
    loading.value = false;
  }
}

function onReportTypeChange(value: 1 | 2) {
  reportType.value = value;
  if (value === 2) {
    filters.beginDate = dayjs().startOf('month');
    filters.beforeDate = dayjs().subtract(1, 'month').startOf('month');
    filters.compareType = '';
  } else {
    filters.beginDate = dayjs().subtract(1, 'day');
    filters.compareType = 1;
    applyCompareType();
  }
  void loadData();
}

function handleReset() {
  filters.AdminIds = [];
  filters.AppUrl = [];
  filters.ChannelIds = [];
  filters.PackageId = '';
  onReportTypeChange(reportType.value);
}

function onBeginDateChange() {
  if (reportType.value === 1 && filters.compareType) {
    applyCompareType();
  }
}

function onCompareTypeChange() {
  applyCompareType();
}

onMounted(() => {
  applyCompareType();
  void loadData();
});
</script>

<template>
  <div>
    <ReportQueryCard title="查询条件">
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
          show-search
          option-filter-prop="label"
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="filters.AppUrl"
          :max-tag-count="1"
          :options="iosAppStoreOptions"
          allow-clear
          class="min-w-[160px]"
          mode="multiple"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="dataSearchType"
          :options="[
            { label: '正式数据', value: 0 },
            { label: '全部', value: 2 },
          ]"
          class="w-32"
          placeholder="请选择数据类型"
        />
      </Space.Compact>
      <template v-if="reportType === 1">
        <DatePicker
          v-model:value="filters.beginDate"
          placeholder="当前时间"
          @change="onBeginDateChange"
        />
        <Space.Compact>
          <span class="query-field-addon">对比类型</span>
          <Select
            v-model:value="filters.compareType"
            :options="CONTRAST_OPTIONS"
            class="w-36"
            @change="onCompareTypeChange"
            placeholder="请选择对比类型"
          />
        </Space.Compact>
        <DatePicker
          v-model:value="filters.beforeDate"
          placeholder="对比时间"
        />
      </template>
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
        <Button :disabled="loading" @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <div v-if="canIncome" class="mb-4">
      <div class="mb-2 flex items-center justify-between">
        <div class="text-base font-medium">公司收入 · 分时趋势</div>
        <Select
          v-model:value="lineMetric"
          :options="
            lineMetrics.map((item) => ({ label: item.label, value: item.key }))
          "
          class="w-44"
        />
      </div>
      <ReportLineChart
        :categories="chartCategories"
        :series="chartSeries"
        height="300px"
      />
    </div>

    <ReportSummaryCards v-if="canWin" :items="kpiCards" />

    <div v-if="canGame" class="mb-4">
      <div class="mb-2 text-base font-medium">游戏盈亏概况 · 场馆盈亏</div>
      <Table
        :columns="venueColumns"
        :data-source="venueItems"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="GameType"
        size="small"
        class="mb-3"
      />
      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <div class="mb-2 font-medium">大额盈利玩家</div>
          <Table
            :columns="playerColumns"
            :data-source="winPlayers"
            :pagination="false"
            bordered
            :row-key="(r: Row) => String(r.LoginAccount || r.Id || Math.random())"
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
            :row-key="(r: Row) => String(r.LoginAccount || r.Id || Math.random())"
            size="small"
          />
        </div>
      </div>
    </div>

    <div v-if="canTopup" class="mb-4">
      <div class="mb-2 text-base font-medium">充值详情</div>
      <ReportSummaryCards
        :items="[
          {
            title: '新用户充值',
            value: formatAmountFromCent(
              num(incomeData.SumNewPayMoney) +
                num(incomeData.SumNewAgentPayMoney),
            ),
          },
          {
            title: '老用户充值',
            value: formatAmountFromCent(
              num(incomeData.SumPayMergerMoney) -
                (num(incomeData.SumNewPayMoney) +
                  num(incomeData.SumNewAgentPayMoney)),
            ),
          },
          {
            title: '官方充值',
            value: formatAmountFromCent(incomeData.SumPayMoney),
          },
          {
            title: '币商充值',
            value: formatAmountFromCent(incomeData.SumAgentPayMoney),
          },
          {
            title: '充值成功率',
            value: percentText(
              incomeData.CountOkOrderNum || incomeData.rechargeOkOrderNum,
              incomeData.CountAllOrderNum || incomeData.rechargeOrderNum,
            ),
          },
        ]"
      />
    </div>
  </div>
</template>
