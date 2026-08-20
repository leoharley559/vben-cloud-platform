<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, h, onMounted, reactive, ref } from 'vue';

import {
  Button,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchOperationPromotionAnalyzeApi } from '#/api/dataClose/operation-daily';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { calcArppu } from '#/utils/promotion-data';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';

import {
  disabledBeforeToday,
  num,
  percentText,
  pickTwoDayItem,
} from '../utils';

defineOptions({ name: 'PromotionAnalyzePanel' });

type Row = Record<string, unknown>;

const { dataSearchTypeOptions } = useReportOptions();

const loading = ref(false);
const showMode = ref<'data' | 'percent'>('data');
const today = ref<Row>({});
const yesterday = ref<Row>({});
const rawChannelItems = ref<Row[]>([]);
const yesterdayChannelItems = ref<Row[]>([]);
const sortRegItems = ref<Row[]>([]);
const yesterdaySortRegItems = ref<Row[]>([]);
const sortPayItems = ref<Row[]>([]);
const yesterdaySortPayItems = ref<Row[]>([]);
const countChannel = ref<Row>({});
const filters = reactive({
  DataSearchType: 0 as number,
  beginDate: dayjs().subtract(2, 'day') as Dayjs,
  endDate: dayjs().subtract(1, 'day') as Dayjs,
});

const dateRange = computed<[Dayjs, Dayjs] | undefined>({
  get: () => [filters.beginDate, filters.endDate],
  set: (value) => {
    if (value?.[0] && value[1]) {
      filters.beginDate = value[0];
      filters.endDate = value[1];
    }
  },
});

const summaryItems = computed(() => {
  const t = today.value;
  const y = yesterday.value;
  const newPayUser =
    num(t.SumNewPayNum) + num(t.SumNewAgentPayNum) || num(t.newPayUser);
  const newPayMoney =
    num(t.SumNewPayMoney) + num(t.SumNewAgentPayMoney) || num(t.newPayMoney);
  const yPayUser =
    num(y.SumNewPayNum) + num(y.SumNewAgentPayNum) || num(y.newPayUser);
  // 对齐旧站：新增用户用 SumNewRegDevice
  const newReg = num(t.SumNewRegDevice ?? t.newRegUser);
  const yReg = num(y.SumNewRegDevice ?? y.newRegUser);
  return [
    { title: '新增用户', value: newReg },
    {
      title: '较昨日(用户)',
      value: Math.abs(newReg - yReg),
    },
    { title: '新增付费用户', value: newPayUser },
    {
      title: '较昨日(付费用户)',
      value: Math.abs(newPayUser - yPayUser),
    },
    {
      title: '新增付费金额',
      value: formatAmountFromCent(newPayMoney),
    },
    {
      title: '新增ARPPU',
      value: calcArppu(newPayUser, newPayMoney),
    },
    {
      title: '有新增渠道数',
      value:
        num(countChannel.value.CountRegNum) || rawChannelItems.value.length,
    },
  ];
});

function trendRender(
  todayVal: number,
  yesterdayVal: number,
  display: string,
  mode: 'diff' | 'ratio' = 'ratio',
) {
  const up = todayVal - yesterdayVal >= 0;
  const pct =
    mode === 'diff'
      ? (todayVal - yesterdayVal).toFixed(2)
      : (yesterdayVal
        ? (((todayVal - yesterdayVal) / yesterdayVal) * 100).toFixed(2)
        : '0.00');
  return h('div', [
    h('div', display),
    h(
      'div',
      { class: up ? 'text-xs text-green-600' : 'text-xs text-red-500' },
      `环比 ${pct}%`,
    ),
  ]);
}

function channelPayNum(item: Row) {
  return num(item.PayNum) + num(item.AgentPayNum) || num(item.TodayPayNum);
}

function channelPayMoney(item: Row) {
  return (
    num(item.PayMoney) + num(item.AgentPayMoney) || num(item.TodayPayMoney)
  );
}

const columns = computed<TableColumnType<Row>[]>(() => [
  {
    align: 'center',
    dataIndex: 'ChannelName',
    key: 'ChannelName',
    title: '渠道',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayReg),
        num(record._yesterdayReg),
        String(record.Reg),
      ),
    key: 'Reg',
    title: '新增注册',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayPayNum),
        num(record._yesterdayPayNum),
        String(record.PayNum),
      ),
    key: 'PayNum',
    title: '新增付费人数',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayPayRate),
        num(record._yesterdayPayRate),
        String(record.TodayPayRate),
        'diff',
      ),
    key: 'TodayPayRate',
    title: '新增付费率',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayPayMoney),
        num(record._yesterdayPayMoney),
        String(record.PayMoneyText),
      ),
    key: 'PayMoneyText',
    title: '新增付费金额',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayArppu),
        num(record._yesterdayArppu),
        String(record.TodayArppu),
        'diff',
      ),
    key: 'TodayArppu',
    title: '新增ARPPU',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayWithdraw),
        num(record._yesterdayWithdraw),
        String(record.WithdrawText),
      ),
    key: 'WithdrawText',
    title: '新增兑换金额',
  },
  {
    align: 'center',
    customRender: ({ record }) =>
      trendRender(
        num(record._todayDiff),
        num(record._yesterdayDiff),
        String(record.DiffText),
      ),
    key: 'DiffText',
    title: '充兑差',
  },
]);

const channelRows = computed(() => {
  const yesterdayById = new Map(
    yesterdayChannelItems.value.map((item) => [
      String(item.ChannelId ?? item.ChannelName),
      item,
    ]),
  );
  const sumTemp = {
    Reg: 0,
    PayNum: 0,
    PayMoney: 0,
    Withdraw: 0,
    Diff: 0,
  };
  const rows = rawChannelItems.value.map((item) => {
    const yest =
      yesterdayById.get(String(item.ChannelId ?? item.ChannelName)) || {};
    const Reg = num(item.Reg || item.SumReg || item.TodayReg);
    const PayNumOnly = num(item.PayNum);
    const PayNum = channelPayNum(item);
    const PayMoney = channelPayMoney(item);
    const WithdrawMoney = num(item.WithdrawMoney || item.SumWithdrawMoney);
    const Diff = WithdrawMoney - PayMoney;
    const YesterdayReg = num(yest.Reg || yest.SumReg || yest.YesterdayReg);
    const YesterdayPayNum = channelPayNum(yest);
    const YesterdayPayMoney = channelPayMoney(yest);
    const YesterdayWithdraw = num(yest.WithdrawMoney || yest.SumWithdrawMoney);
    const YesterdayDiff = YesterdayWithdraw - YesterdayPayMoney;
    const TodayPayRateNum = Reg ? (PayNum / Reg) * 100 : 0;
    const YesterdayPayRateNum = YesterdayReg
      ? (YesterdayPayNum / YesterdayReg) * 100
      : 0;
    const TodayArppuNum = Number(calcArppu(PayNumOnly, PayMoney));
    const YesterdayArppuNum = Number(
      calcArppu(num(yest.PayNum), YesterdayPayMoney),
    );
    sumTemp.Reg += Reg;
    sumTemp.PayNum += PayNum;
    sumTemp.PayMoney += PayMoney;
    sumTemp.Withdraw += WithdrawMoney;
    sumTemp.Diff += Diff;
    return {
      ...item,
      ChannelName: item.ChannelName || item.ChannelId || '-',
      Reg,
      PayNum,
      PayMoney,
      TodayPayRate: percentText(PayNum, Reg),
      TodayArppu: calcArppu(PayNumOnly, PayMoney),
      PayMoneyText: formatAmountFromCent(PayMoney),
      WithdrawText: formatAmountFromCent(WithdrawMoney),
      DiffText: formatAmountFromCent(Diff),
      _todayReg: Reg,
      _yesterdayReg: YesterdayReg,
      _todayPayNum: PayNum,
      _yesterdayPayNum: YesterdayPayNum,
      _todayPayRate: TodayPayRateNum,
      _yesterdayPayRate: YesterdayPayRateNum,
      _todayPayMoney: PayMoney,
      _yesterdayPayMoney: YesterdayPayMoney,
      _todayArppu: TodayArppuNum,
      _yesterdayArppu: YesterdayArppuNum,
      _todayWithdraw: WithdrawMoney,
      _yesterdayWithdraw: YesterdayWithdraw,
      _todayDiff: Diff,
      _yesterdayDiff: YesterdayDiff,
    };
  });
  if (showMode.value !== 'percent') return rows;
  return rows.map((row) => ({
    ...row,
    Reg: sumTemp.Reg
      ? `${((num(row._todayReg) / sumTemp.Reg) * 100).toFixed(2)}%`
      : '0%',
    PayNum: sumTemp.PayNum
      ? `${((num(row._todayPayNum) / sumTemp.PayNum) * 100).toFixed(2)}%`
      : '0%',
    PayMoneyText: sumTemp.PayMoney
      ? `${((num(row._todayPayMoney) / sumTemp.PayMoney) * 100).toFixed(2)}%`
      : '0%',
    WithdrawText: sumTemp.Withdraw
      ? `${((num(row._todayWithdraw) / sumTemp.Withdraw) * 100).toFixed(2)}%`
      : '0%',
    DiffText: sumTemp.Diff
      ? `${((num(row._todayDiff) / sumTemp.Diff) * 100).toFixed(2)}%`
      : '0%',
  }));
});

function top10Dual(
  todayList: Row[],
  yesterdayList: Row[],
  pickValue: (item: Row) => number,
  todayName: string,
  yesterdayName: string,
) {
  const list = [...todayList]
    .map((item) => ({
      name: String(item.ChannelName || item.ChannelId || '-'),
      value: pickValue(item),
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 10);
  const yesterdayByName = new Map(
    yesterdayList.map((item) => [
      String(item.ChannelName || item.ChannelId || '-'),
      pickValue(item),
    ]),
  );
  return {
    categories: list.map((item) => item.name),
    series: [
      {
        data: list.map((item) => item.value),
        name: todayName,
        type: 'bar' as const,
      },
      {
        data: list.map((item) => yesterdayByName.get(item.name) || 0),
        name: yesterdayName,
        type: 'bar' as const,
      },
    ],
  };
}

const topRegChart = computed(() =>
  top10Dual(
    sortRegItems.value.length > 0 ? sortRegItems.value : rawChannelItems.value,
    yesterdaySortRegItems.value.length > 0
      ? yesterdaySortRegItems.value
      : yesterdayChannelItems.value,
    (item) => num(item.SumReg ?? item.Reg ?? item.TodayReg),
    filters.endDate.format('YYYY-MM-DD'),
    filters.beginDate.format('YYYY-MM-DD'),
  ),
);

const topPayChart = computed(() =>
  top10Dual(
    sortPayItems.value.length > 0 ? sortPayItems.value : rawChannelItems.value,
    yesterdaySortPayItems.value.length > 0
      ? yesterdaySortPayItems.value
      : yesterdayChannelItems.value,
    (item) =>
      (num(item.SumNewPayMoney) ||
        num(item.PayMoney) + num(item.AgentPayMoney) ||
        num(item.TodayPayMoney)) / 100,
    filters.endDate.format('YYYY-MM-DD'),
    filters.beginDate.format('YYYY-MM-DD'),
  ),
);

function buildQuery() {
  return {
    BeginTime: filters.beginDate.format('YYYY-MM-DD'),
    EndTime: filters.endDate.format('YYYY-MM-DD'),
    DataSearchType: filters.DataSearchType,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const data = (await fetchOperationPromotionAnalyzeApi(buildQuery())) as Row;
    const endKey = filters.endDate.format('YYYY-MM-DD');
    const beginKey = filters.beginDate.format('YYYY-MM-DD');
    today.value = pickTwoDayItem(data, endKey);
    yesterday.value = pickTwoDayItem(data, beginKey);
    rawChannelItems.value = (data.TodayChannelDauTable ||
      data.TodayChannelItems ||
      []) as Row[];
    yesterdayChannelItems.value = (data.YesterdayChannelDauTable ||
      data.YesterdayChannelItems ||
      []) as Row[];
    sortRegItems.value = (data.TodayChannelItemsSortReg || []) as Row[];
    yesterdaySortRegItems.value = (data.YesterdayChannelItemsSortReg ||
      []) as Row[];
    sortPayItems.value = (data.TodayChannelItemsSortPay || []) as Row[];
    yesterdaySortPayItems.value = (data.YesterdayChannelItemsSortPay ||
      []) as Row[];
    countChannel.value = (data.CountChannelNum || {}) as Row;
  } catch {
    today.value = {};
    yesterday.value = {};
    rawChannelItems.value = [];
    yesterdayChannelItems.value = [];
    sortRegItems.value = [];
    yesterdaySortRegItems.value = [];
    sortPayItems.value = [];
    yesterdaySortPayItems.value = [];
    countChannel.value = {};
    message.error('推广分析加载失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.DataSearchType = 0;
  filters.beginDate = dayjs().subtract(2, 'day');
  filters.endDate = dayjs().subtract(1, 'day');
  void loadData();
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div>
    <ReportQueryCard actions-single title="查询条件">
      <Space.Compact>
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="filters.DataSearchType"
          :options="dataSearchTypeOptions"
          class="w-36"
          placeholder="请选择数据类型"
        />
      </Space.Compact>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker
          v-model="dateRange"
          :disabled-date="disabledBeforeToday"
          :max-range-days="1"
          label="时间范围"
          precision="date"
        />
      </div>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadData">
          查询
        </Button>
        <Button :disabled="loading" @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <div class="mb-3 grid gap-3 md:grid-cols-2">
      <ReportLineChart
        title="新增注册 Top10"
        :categories="topRegChart.categories"
        :series="topRegChart.series"
        height="280px"
      />
      <ReportLineChart
        title="新增付费金额 Top10"
        :categories="topPayChart.categories"
        :series="topPayChart.series"
        height="280px"
      />
    </div>

    <div class="mb-3">
      <RadioGroup v-model:value="showMode" button-style="solid" size="small">
        <RadioButton value="data">显示数据</RadioButton>
        <RadioButton value="percent">显示占比</RadioButton>
      </RadioGroup>
    </div>
    <Table
      :columns="columns"
      :data-source="channelRows"
      :loading="loading"
      :pagination="false"
      bordered
      :row-key="(r: Row) => String(r.ChannelId || r.ChannelName)"
      size="small"
    />
  </div>
</template>
