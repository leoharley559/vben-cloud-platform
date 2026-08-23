<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  Radio,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchOperationIncomeAnalyzeApi } from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useReportOptions } from '#/composables/use-report-options';
import { arrayToCsvParam, cents } from '#/views/dataClose/shared/report-utils';

import {
  disabledBeforeToday,
  num,
  percentText,
  pickTwoDayItem,
} from '../utils';

defineOptions({ name: 'IncomeAnalyzePanel' });

type Row = Record<string, unknown>;

const { dataSearchTypeOptions, packageOptions } = useReportOptions();

const loading = ref(false);
const reportType = ref<1 | 2>(1);
const raw = ref<Row>({});
const filters = reactive({
  AdminIds: [] as Array<number | string>,
  ChannelIds: [] as Array<number | string>,
  DataSearchType: 0 as number,
  PackageId: '' as number | string,
  beginDate: dayjs().subtract(2, 'day') as Dayjs,
  endDate: dayjs().subtract(1, 'day') as Dayjs,
});

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

const dateRange = computed<[Dayjs, Dayjs] | undefined>({
  get(): [Dayjs, Dayjs] {
    return [filters.beginDate, filters.endDate];
  },
  set(value: [Dayjs, Dayjs] | null | undefined) {
    if (value?.[0] && value[1]) {
      filters.beginDate = value[0];
      filters.endDate = value[1];
    }
  },
});

/** 日报：End=当前日 Begin=对比日；月报：Begin=当前月 End=对比月 */
const today = computed(() =>
  reportType.value === 2
    ? pickTwoDayItem(raw.value, filters.beginDate.format('YYYY-MM'))
    : pickTwoDayItem(raw.value, filters.endDate.format('YYYY-MM-DD')),
);
const yesterday = computed(() =>
  reportType.value === 2
    ? pickTwoDayItem(raw.value, filters.endDate.format('YYYY-MM'))
    : pickTwoDayItem(raw.value, filters.beginDate.format('YYYY-MM-DD')),
);

function deltaPct(cur: unknown, prev: unknown) {
  const a = num(cur);
  const b = num(prev);
  if (!b) return '0%';
  return `${Math.abs(((a - b) / b) * 100).toFixed(0)}%`;
}

function asYuan(cents: unknown) {
  return Number((num(cents) / 100).toFixed(0));
}

function listByKey(data: Row, key: string) {
  const list = data[key];
  return Array.isArray(list) ? (list as Row[]) : [];
}

function intervalTitles(data: Row) {
  const map = (data.TitleName || {}) as Record<string, string>;
  const entries = Object.entries(map);
  if (entries.length > 0) {
    return entries.map(([id, label]) => ({ id, label: String(label) }));
  }
  const ids = new Set<string>();
  for (const key of [
    'TodayPayInterval',
    'YesterdayPayInterval',
    'TodayWithdrawInterval',
    'YesterdayWithdrawInterval',
    'TodayPayIntervalForSuccessOdd',
    'YesterdayPayIntervalForSuccessOdd',
  ]) {
    for (const item of listByKey(data, key)) {
      const id = String(item.IntervalMoneyId ?? '');
      if (id) ids.add(id);
    }
  }
  return [...ids].map((id) => ({ id, label: id }));
}

function intervalCount(list: Row[], id: string, field: string) {
  const row = list.find((item) => String(item.IntervalMoneyId) === id);
  return num(row?.[field]);
}

function intervalRate(list: Row[], id: string) {
  const row = list.find((item) => String(item.IntervalMoneyId) === id) || {};
  const all = num(row.CountAllNum);
  return all ? Number(((num(row.CountOkNum) / all) * 100).toFixed(2)) : 0;
}

const currentLabel = computed(() =>
  reportType.value === 2
    ? filters.beginDate.format('YYYY-MM')
    : filters.endDate.format('YYYY-MM-DD'),
);
const compareLabel = computed(() =>
  reportType.value === 2
    ? filters.endDate.format('YYYY-MM')
    : filters.beginDate.format('YYYY-MM-DD'),
);

function orderStats(list: Row[]) {
  let ok = 0;
  let all = 0;
  for (const item of list) {
    ok += num(item.CountOkNum);
    all += num(item.CountAllNum);
  }
  return { ok, all };
}

const todayPayInterval = computed(() =>
  listByKey(raw.value, 'TodayPayInterval'),
);
const yesterdayPayInterval = computed(() =>
  listByKey(raw.value, 'YesterdayPayInterval'),
);
const todayOrder = computed(() => orderStats(todayPayInterval.value));
const yesterdayOrder = computed(() => orderStats(yesterdayPayInterval.value));

const summaryItems = computed(() => {
  const t = today.value;
  const y = yesterday.value;
  const recharge =
    num(t.SumPayMoney) + num(t.SumAgentPayMoney) ||
    num(t.SumPayMergerMoney) ||
    num(t.rechargeMoney);
  const withdraw = num(t.SumWithdrawMoney || t.withdrawMoney);
  const newPay =
    num(t.SumNewPayMoney) + num(t.SumNewAgentPayMoney) || num(t.newPayMoney);
  const yRecharge =
    num(y.SumPayMoney) + num(y.SumAgentPayMoney) ||
    num(y.SumPayMergerMoney) ||
    num(y.rechargeMoney);
  const orderAll = todayOrder.value.all;
  const yOrderAll = yesterdayOrder.value.all;

  return [
    {
      title: `充值人数(环比${deltaPct(t.SumPayMergerNum || t.rechargeNum, y.SumPayMergerNum || y.rechargeNum)})`,
      value: num(t.SumPayMergerNum || t.rechargeNum),
    },
    {
      title: `充值订单(环比${deltaPct(orderAll, yOrderAll)})`,
      value: orderAll,
    },
    {
      title: `兑换人数(环比${deltaPct(t.SumWithdrawNum || t.withdrawNum, y.SumWithdrawNum || y.withdrawNum)})`,
      value: num(t.SumWithdrawNum || t.withdrawNum),
    },
    {
      title: `充值(环比${deltaPct(recharge, yRecharge)})`,
      value: cents(recharge),
    },
    {
      title: '兑换',
      value: cents(withdraw),
    },
    {
      title: '充兑差',
      value: cents(recharge - withdraw),
    },
    {
      title: '新用户充值',
      value: cents(newPay),
    },
    {
      title: '老用户充值',
      value: cents(recharge - newPay),
    },
    {
      title: '官方充值',
      value: cents(t.SumPayMoney || t.officialPayMoney),
    },
    {
      title: '币商充值',
      value: cents(t.SumAgentPayMoney || t.agentPayMoney),
    },
    {
      title: `充值成功率(环比${deltaPct(todayOrder.value.ok / (todayOrder.value.all || 1), yesterdayOrder.value.ok / (yesterdayOrder.value.all || 1))})`,
      value: percentText(todayOrder.value.ok, todayOrder.value.all),
    },
  ];
});

const pieNewOld = computed(() => {
  const t = today.value;
  const recharge =
    num(t.SumPayMoney) + num(t.SumAgentPayMoney) || num(t.SumPayMergerMoney);
  const newPay = num(t.SumNewPayMoney) + num(t.SumNewAgentPayMoney);
  return [
    { name: '老用户', value: asYuan(recharge - newPay) },
    { name: '新用户', value: asYuan(newPay) },
  ];
});

const pieSource = computed(() => {
  const t = today.value;
  return [
    { name: '官方充值', value: asYuan(t.SumPayMoney) },
    { name: '币商充值', value: asYuan(t.SumAgentPayMoney) },
  ];
});

const pieDiff = computed(() => {
  const t = today.value;
  const recharge =
    num(t.SumPayMoney) + num(t.SumAgentPayMoney) || num(t.SumPayMergerMoney);
  const withdraw = num(t.SumWithdrawMoney);
  return [
    { name: '充值', value: asYuan(recharge) },
    { name: '兑换', value: asYuan(withdraw) },
    { name: '充兑差', value: asYuan(recharge - withdraw) },
  ];
});

const rechargePeopleChart = computed(() => {
  const titles = intervalTitles(raw.value);
  const todayList = todayPayInterval.value;
  const yestList = yesterdayPayInterval.value;
  return {
    categories: titles.map((item) => item.label),
    series: [
      {
        data: titles.map((item) =>
          intervalCount(todayList, item.id, 'CountOkPlayerNum'),
        ),
        name: currentLabel.value,
        type: 'bar' as const,
      },
      {
        data: titles.map((item) =>
          intervalCount(yestList, item.id, 'CountOkPlayerNum'),
        ),
        name: compareLabel.value,
        type: 'bar' as const,
      },
    ],
  };
});

const withdrawPeopleChart = computed(() => {
  const titles = intervalTitles(raw.value);
  const todayList = listByKey(raw.value, 'TodayWithdrawInterval');
  const yestList = listByKey(raw.value, 'YesterdayWithdrawInterval');
  return {
    categories: titles.map((item) => item.label),
    series: [
      {
        data: titles.map((item) =>
          intervalCount(todayList, item.id, 'CountOkPlayerNum'),
        ),
        name: currentLabel.value,
        type: 'bar' as const,
      },
      {
        data: titles.map((item) =>
          intervalCount(yestList, item.id, 'CountOkPlayerNum'),
        ),
        name: compareLabel.value,
        type: 'bar' as const,
      },
    ],
  };
});

const rechargeRateChart = computed(() => {
  const titles = intervalTitles(raw.value);
  const todayList = listByKey(raw.value, 'TodayPayIntervalForSuccessOdd');
  const yestList = listByKey(raw.value, 'YesterdayPayIntervalForSuccessOdd');
  return {
    categories: titles.map((item) => item.label),
    series: [
      {
        data: titles.map((item) => intervalRate(todayList, item.id)),
        name: currentLabel.value,
        type: 'bar' as const,
      },
      {
        data: titles.map((item) => intervalRate(yestList, item.id)),
        name: compareLabel.value,
        type: 'bar' as const,
      },
    ],
  };
});

const hasIntervalCharts = computed(() => intervalTitles(raw.value).length > 0);

const channelRows = computed(() => {
  const list = (raw.value.TodayChannelItems ||
    raw.value.ChannelItems ||
    raw.value.Items ||
    []) as Row[];
  return list.map((item) => {
    const pay =
      num(item.PayMoney) + num(item.AgentPayMoney) || num(item.SumPayMoney);
    const withdraw = num(item.WithdrawMoney || item.SumWithdrawMoney);
    return {
      ...item,
      ChannelName: item.ChannelName || item.ChannelId || '-',
      PayMoneyText: cents(pay),
      WithdrawText: cents(withdraw),
      DiffText: cents(pay - withdraw),
      PayNum: num(item.PayNum) + num(item.AgentPayNum) || num(item.SumPayNum),
    };
  });
});

const channelColumns: TableColumnType<Row>[] = [
  {
    align: 'center',
    dataIndex: 'ChannelName',
    key: 'ChannelName',
    title: '渠道',
  },
  {
    align: 'center',
    dataIndex: 'PayNum',
    key: 'PayNum',
    title: '充值人数',
  },
  {
    align: 'center',
    dataIndex: 'PayMoneyText',
    key: 'PayMoneyText',
    title: '充值金额',
  },
  {
    align: 'center',
    dataIndex: 'WithdrawText',
    key: 'WithdrawText',
    title: '兑换金额',
  },
  {
    align: 'center',
    dataIndex: 'DiffText',
    key: 'DiffText',
    title: '充兑差',
  },
];

function buildQuery() {
  return {
    BeginTime:
      reportType.value === 2
        ? filters.beginDate.format('YYYY-MM')
        : filters.beginDate.format('YYYY-MM-DD'),
    EndTime:
      reportType.value === 2
        ? filters.endDate.format('YYYY-MM')
        : filters.endDate.format('YYYY-MM-DD'),
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    PackageId: filters.PackageId || '',
    DataSearchType: filters.DataSearchType,
    ReportType: reportType.value,
  };
}

async function loadData() {
  loading.value = true;
  try {
    raw.value = (await fetchOperationIncomeAnalyzeApi(buildQuery())) as Row;
  } catch {
    raw.value = {};
    message.error('收入分析加载失败');
  } finally {
    loading.value = false;
  }
}

function onReportTypeChange(value: 1 | 2) {
  reportType.value = value;
  if (value === 2) {
    filters.beginDate = dayjs().startOf('month');
    filters.endDate = dayjs().subtract(1, 'month').startOf('month');
  } else {
    filters.beginDate = dayjs().subtract(2, 'day');
    filters.endDate = dayjs().subtract(1, 'day');
  }
  void loadData();
}

function handleReset() {
  filters.AdminIds = [];
  filters.ChannelIds = [];
  filters.DataSearchType = 0;
  filters.PackageId = '';
  onReportTypeChange(reportType.value);
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        :value="reportType"
        button-style="solid"
        @update:value="onReportTypeChange"
      >
        <Radio.Button :value="1">日报</Radio.Button>
        <Radio.Button :value="2">月报</Radio.Button>
      </Radio.Group>
    </div>
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
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="filters.AdminIds" class="min-w-[180px]" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect
          v-model="filters.ChannelIds"
          class="min-w-[180px]"
          placeholder="请输入渠道号"
        />
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
      <div v-if="reportType === 1" class="query-filter-wide">
        <QueryDatetimeRangePicker
          v-model="dateRange"
          :disabled-date="disabledBeforeToday"
          :max-range-days="1"
          label="时间范围"
          precision="date"
        />
      </div>
      <template v-else>
        <Space.Compact>
          <span class="query-field-addon">当前月</span>
          <DatePicker
            v-model:value="filters.beginDate"
            picker="month"
            placeholder="请选择当前月"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">对比月</span>
          <DatePicker
            v-model:value="filters.endDate"
            picker="month"
            placeholder="请选择对比月"
          />
        </Space.Compact>
      </template>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadData">
          查询
        </Button>
        <Button :disabled="loading" @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <div class="mb-4 grid gap-3 md:grid-cols-3">
      <div class="rounded border border-border p-3">
        <ReportPieChart title="新老用户充值" :data="pieNewOld" height="220px" />
      </div>
      <div class="rounded border border-border p-3">
        <ReportPieChart title="充值来源" :data="pieSource" height="220px" />
      </div>
      <div class="rounded border border-border p-3">
        <ReportPieChart title="充兑差" :data="pieDiff" height="220px" />
      </div>
    </div>

    <div v-if="hasIntervalCharts" class="mb-4 grid gap-3 md:grid-cols-2">
      <ReportLineChart
        title="充值人数"
        :categories="rechargePeopleChart.categories"
        :series="rechargePeopleChart.series"
        height="300px"
      />
      <ReportLineChart
        title="兑换人数"
        :categories="withdrawPeopleChart.categories"
        :series="withdrawPeopleChart.series"
        height="300px"
      />
    </div>
    <div v-if="hasIntervalCharts" class="mb-4">
      <ReportLineChart
        title="充值成功率"
        :categories="rechargeRateChart.categories"
        :series="rechargeRateChart.series"
        height="300px"
      />
    </div>

    <div v-if="channelRows.length > 0" class="mb-2 text-base font-medium">
      渠道明细
    </div>
    <Table
      v-if="channelRows.length > 0"
      :columns="channelColumns"
      :data-source="channelRows"
      :loading="loading"
      :pagination="false"
      bordered
      :row-key="(r: Row) => String(r.ChannelId || r.ChannelName)"
      size="small"
    />
  </div>
</template>
