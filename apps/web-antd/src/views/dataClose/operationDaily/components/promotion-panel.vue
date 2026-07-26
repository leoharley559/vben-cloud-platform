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
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchOperationPromotionAnalyzeApi } from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { calcArppu } from '#/utils/promotion-data';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import { num, percentText, pickTwoDayItem } from '../utils';

defineOptions({ name: 'PromotionAnalyzePanel' });

type Row = Record<string, unknown>;

const { dataSearchTypeOptions, iosAppStoreOptions, packageOptions } =
  useReportOptions();

const loading = ref(false);
const showMode = ref<'data' | 'percent'>('data');
const today = ref<Row>({});
const yesterday = ref<Row>({});
const rawChannelItems = ref<Row[]>([]);
const sortRegItems = ref<Row[]>([]);
const sortPayItems = ref<Row[]>([]);
const countChannel = ref<Row>({});
const filters = reactive({
  AdminIds: [] as Array<number | string>,
  AppUrl: [] as string[],
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

const columns = computed<TableColumnType<Row>[]>(() => [
  {
    align: 'center',
    dataIndex: 'ChannelName',
    key: 'ChannelName',
    title: '渠道',
  },
  { align: 'center', dataIndex: 'Reg', key: 'Reg', title: '今日新增注册' },
  {
    align: 'center',
    dataIndex: 'TodayPayRate',
    key: 'TodayPayRate',
    title: '今日新增付费率',
  },
  {
    align: 'center',
    dataIndex: 'PayNum',
    key: 'PayNum',
    title: '今日新增付费人数',
  },
  {
    align: 'center',
    dataIndex: 'PayMoneyText',
    key: 'PayMoneyText',
    title: '今日新增付费金额',
  },
  {
    align: 'center',
    dataIndex: 'TodayArppu',
    key: 'TodayArppu',
    title: '今日新增ARPPU',
  },
  {
    align: 'center',
    dataIndex: 'DiffText',
    key: 'DiffText',
    title: '充兑差',
  },
]);

const channelRows = computed(() => {
  const sumTemp = { Reg: 0, PayNum: 0, PayMoney: 0, Diff: 0 };
  const rows = rawChannelItems.value.map((item) => {
    const Reg = num(item.Reg || item.SumReg || item.TodayReg);
    const PayNum =
      num(item.PayNum) + num(item.AgentPayNum) || num(item.TodayPayNum);
    const PayMoney =
      num(item.PayMoney) + num(item.AgentPayMoney) || num(item.TodayPayMoney);
    const WithdrawMoney = num(item.WithdrawMoney || item.SumWithdrawMoney);
    const Diff = WithdrawMoney - PayMoney;
    sumTemp.Reg += Reg;
    sumTemp.PayNum += PayNum;
    sumTemp.PayMoney += PayMoney;
    sumTemp.Diff += Diff;
    return {
      ...item,
      ChannelName: item.ChannelName || item.ChannelId || '-',
      Reg,
      PayNum,
      PayMoney,
      TodayPayRate: percentText(PayNum, Reg),
      TodayArppu: calcArppu(PayNum, PayMoney),
      PayMoneyText: formatAmountFromCent(PayMoney),
      DiffText: formatAmountFromCent(Diff),
      _rawPayMoney: PayMoney,
      _rawDiff: Diff,
    };
  });
  if (showMode.value !== 'percent') return rows;
  return rows.map((row) => ({
    ...row,
    Reg: sumTemp.Reg
      ? `${((num(row.Reg) / sumTemp.Reg) * 100).toFixed(2)}%`
      : '0%',
    PayNum: sumTemp.PayNum
      ? `${((num(row.PayNum) / sumTemp.PayNum) * 100).toFixed(2)}%`
      : '0%',
    PayMoneyText: sumTemp.PayMoney
      ? `${((num(row._rawPayMoney) / sumTemp.PayMoney) * 100).toFixed(2)}%`
      : '0%',
    DiffText: sumTemp.Diff
      ? `${((num(row._rawDiff) / sumTemp.Diff) * 100).toFixed(2)}%`
      : '0%',
  }));
});

const topRegChart = computed(() => {
  const source =
    sortRegItems.value.length > 0 ? sortRegItems.value : rawChannelItems.value;
  const list = [...source]
    .map((item) => ({
      name: String(item.ChannelName || item.ChannelId),
      value: num(item.SumReg ?? item.Reg ?? item.TodayReg),
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 10);
  return {
    categories: list.map((item) => item.name),
    series: [
      {
        data: list.map((item) => item.value),
        name: '新增注册',
        type: 'bar' as const,
      },
    ],
  };
});

const topPayChart = computed(() => {
  const source =
    sortPayItems.value.length > 0 ? sortPayItems.value : rawChannelItems.value;
  const list = [...source]
    .map((item) => ({
      name: String(item.ChannelName || item.ChannelId),
      value:
        (num(item.SumNewPayMoney) ||
          num(item.PayMoney) + num(item.AgentPayMoney) ||
          num(item.TodayPayMoney)) / 100,
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 10);
  return {
    categories: list.map((item) => item.name),
    series: [
      {
        data: list.map((item) => item.value),
        name: '新增付费金额',
        type: 'bar' as const,
      },
    ],
  };
});

function buildQuery() {
  return {
    BeginTime: filters.beginDate.format('YYYY-MM-DD'),
    EndTime: filters.endDate.format('YYYY-MM-DD'),
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
    PackageId: filters.PackageId || '',
    DataSearchType: filters.DataSearchType,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const data = (await fetchOperationPromotionAnalyzeApi(
      buildQuery(),
    )) as Row;
    const endKey = filters.endDate.format('YYYY-MM-DD');
    const beginKey = filters.beginDate.format('YYYY-MM-DD');
    today.value = pickTwoDayItem(data, endKey);
    yesterday.value = pickTwoDayItem(data, beginKey);
    rawChannelItems.value = (data.TodayChannelDauTable ||
      data.TodayChannelItems ||
      []) as Row[];
    sortRegItems.value = (data.TodayChannelItemsSortReg || []) as Row[];
    sortPayItems.value = (data.TodayChannelItemsSortPay || []) as Row[];
    countChannel.value = (data.CountChannelNum || {}) as Row;
  } catch {
    today.value = {};
    yesterday.value = {};
    rawChannelItems.value = [];
    sortRegItems.value = [];
    sortPayItems.value = [];
    countChannel.value = {};
    message.error('推广分析加载失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.AdminIds = [];
  filters.AppUrl = [];
  filters.ChannelIds = [];
  filters.DataSearchType = 0;
  filters.PackageId = '';
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
    <ReportQueryCard title="查询条件">
      <Select
        v-model:value="filters.DataSearchType"
        :options="dataSearchTypeOptions"
        class="w-36"
        placeholder="数据类型"
      />
      <AccountSelect v-model="filters.AdminIds" class="min-w-[180px]" />
      <ChannelSelect v-model="filters.ChannelIds" class="min-w-[180px]" />
      <Select
        v-model:value="filters.PackageId"
        :options="packageSelectOptions"
        allow-clear
        class="w-40"
        placeholder="产品"
        show-search
        option-filter-prop="label"
      />
      <Select
        v-model:value="filters.AppUrl"
        :max-tag-count="1"
        :options="iosAppStoreOptions"
        allow-clear
        class="min-w-[160px]"
        mode="multiple"
        placeholder="上架包"
      />
      <DatePicker v-model:value="filters.beginDate" placeholder="开始日期" />
      <DatePicker v-model:value="filters.endDate" placeholder="结束日期" />
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
