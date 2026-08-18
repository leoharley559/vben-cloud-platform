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

import { fetchOperationIncomeAnalyzeApi } from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import { num, percentText, pickTwoDayItem } from '../utils';

defineOptions({ name: 'IncomeAnalyzePanel' });

type Row = Record<string, unknown>;

const { dataSearchTypeOptions, iosAppStoreOptions, packageOptions } =
  useReportOptions();

const loading = ref(false);
const reportType = ref<1 | 2>(1);
const raw = ref<Row>({});
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

  return [
    {
      title: `充值人数(环比${deltaPct(t.SumPayMergerNum || t.rechargeNum, y.SumPayMergerNum || y.rechargeNum)})`,
      value: num(t.SumPayMergerNum || t.rechargeNum),
    },
    {
      title: `兑换人数(环比${deltaPct(t.SumWithdrawNum || t.withdrawNum, y.SumWithdrawNum || y.withdrawNum)})`,
      value: num(t.SumWithdrawNum || t.withdrawNum),
    },
    {
      title: `充值(环比${deltaPct(recharge, yRecharge)})`,
      value: formatAmountFromCent(recharge),
    },
    {
      title: '兑换',
      value: formatAmountFromCent(withdraw),
    },
    {
      title: '充兑差',
      value: formatAmountFromCent(recharge - withdraw),
    },
    {
      title: '新用户充值',
      value: formatAmountFromCent(newPay),
    },
    {
      title: '老用户充值',
      value: formatAmountFromCent(recharge - newPay),
    },
    {
      title: '官方充值',
      value: formatAmountFromCent(t.SumPayMoney || t.officialPayMoney),
    },
    {
      title: '币商充值',
      value: formatAmountFromCent(t.SumAgentPayMoney || t.agentPayMoney),
    },
    {
      title: '充值成功率',
      value: (() => {
        const intervals = (raw.value.TodayPayInterval ||
          raw.value.TodayPayIntervalForSuccessOdd ||
          []) as Row[];
        if (Array.isArray(intervals) && intervals.length > 0) {
          let ok = 0;
          let all = 0;
          for (const item of intervals) {
            ok += num(item.CountOkNum);
            all += num(item.CountAllNum);
          }
          return percentText(ok, all);
        }
        return percentText(
          t.CountOkOrderNum || t.rechargeOkOrderNum,
          t.CountAllOrderNum || t.rechargeOrderNum,
        );
      })(),
    },
  ];
});

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
      PayMoneyText: formatAmountFromCent(pay),
      WithdrawText: formatAmountFromCent(withdraw),
      DiffText: formatAmountFromCent(pay - withdraw),
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
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
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
  filters.AppUrl = [];
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
      <DatePicker
        v-if="reportType === 1"
        v-model:value="filters.beginDate"
        placeholder="开始日期"
      />
      <DatePicker
        v-if="reportType === 1"
        v-model:value="filters.endDate"
        placeholder="结束日期"
      />
      <DatePicker
        v-if="reportType === 2"
        v-model:value="filters.beginDate"
        picker="month"
        placeholder="当前月"
      />
      <DatePicker
        v-if="reportType === 2"
        v-model:value="filters.endDate"
        picker="month"
        placeholder="对比月"
      />
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadData">
          查询
        </Button>
        <Button :disabled="loading" @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

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
