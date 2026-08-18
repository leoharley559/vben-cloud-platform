<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchDataAnalyzeApi,
  fetchDataAnalyzeReportApi,
} from '#/api/dataClose/operation-daily';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import {
  applyCompareFormulas,
  buildMetricRow,
  COMPARE_METRICS,
  type CompareBucket,
  deltaColor,
  disposeMoneyBuckets,
  num,
  resolveChartFieldValue,
} from '../utils';

defineOptions({ name: 'DataComparePanel' });

const { checkPermission } = useCloudPermission();
const { iosAppStoreOptions, packageOptions } = useReportOptions();

const loading = ref(false);
const reportType = ref<1 | 2>(1);
const dataSearchType = ref(0);
const filters = reactive({
  AdminIds: [] as Array<number | string>,
  AppUrl: [] as string[],
  ChannelIds: [] as Array<number | string>,
  PackageId: '' as number | string,
  beginDate: dayjs().subtract(1, 'day') as Dayjs,
  beforeDate: dayjs().subtract(1, 'month').startOf('month') as Dayjs,
});

const metricMap = ref<Record<string, CompareBucket>>({});
const chartVisible = ref(false);
const chartLoading = ref(false);
const chartTitle = ref('');
const chartCategories = ref<string[]>([]);
const chartSeries = ref<Array<{ data: number[]; name: string; type?: 'line' }>>(
  [],
);

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

const dayColumns: TableColumnType[] = [
  { align: 'center', dataIndex: 'label', key: 'label', title: '数据名称' },
  { align: 'center', dataIndex: 'TodayItems', key: 'TodayItems', title: '数据' },
  {
    align: 'center',
    dataIndex: 'YestDayItems',
    key: 'YestDayItems',
    title: '较前日',
  },
  {
    align: 'center',
    dataIndex: 'Day7Items',
    key: 'Day7Items',
    title: '较七日平均',
  },
  {
    align: 'center',
    dataIndex: 'Day30Items',
    key: 'Day30Items',
    title: '较30日平均',
  },
  {
    align: 'center',
    dataIndex: 'LastWeekItems',
    key: 'LastWeekItems',
    title: '较上周周期',
  },
  {
    align: 'center',
    dataIndex: 'LastMonthItems',
    key: 'LastMonthItems',
    title: '较上月周期',
  },
  { align: 'center', key: 'graph', title: '图表' },
];

const monthColumns: TableColumnType[] = [
  { align: 'center', dataIndex: 'label', key: 'label', title: '数据名称' },
  {
    align: 'center',
    dataIndex: 'TodayItems',
    key: 'TodayItems',
    title: '当前数据',
  },
  {
    align: 'center',
    dataIndex: 'BeforeDayItems',
    key: 'BeforeDayItems',
    title: '对比数据',
  },
  {
    align: 'center',
    dataIndex: 'CompareMonth',
    key: 'CompareMonth',
    title: '对比结果',
  },
  { align: 'center', key: 'graph', title: '图表' },
];

const sections = computed(() => {
  const beginTs = filters.beginDate?.unix() || 0;
  const beforeTs = filters.beforeDate?.unix() || 0;
  const groups = new Map<string, Array<Record<string, unknown>>>();
  for (const metric of COMPARE_METRICS) {
    if (metric.permission && !checkPermission(metric.permission)) continue;
    const row = {
      ...buildMetricRow(metricMap.value as any, metric.field, beginTs, beforeTs),
      field: metric.field,
      label: metric.label,
      isRate: metric.isRate,
      section: metric.section,
    };
    if (metric.isRate && row.TodayItems != null) {
      row.TodayItems = `${row.TodayItems}%`;
    }
    const list = groups.get(metric.section) || [];
    list.push(row);
    groups.set(metric.section, list);
  }
  return [...groups.entries()].map(([title, rows]) => ({ rows, title }));
});

/** 各权限区块首行「当前值」摘要卡 */
const summaryItems = computed(() => {
  const today = (metricMap.value.TodayItems || {}) as CompareBucket;
  const items: Array<{ title: string; value: number | string }> = [];
  if (checkPermission(10_518)) {
    items.push(
      { title: '注册人数', value: num(today.SumReg) },
      { title: '首存人数', value: num(today.SumFirstPayNum) },
      {
        title: '转化率',
        value: `${today.PercentConversion ?? '0.00'}%`,
      },
    );
  }
  if (checkPermission(10_519)) {
    items.push(
      { title: '登录人数', value: num(today.SumLogin) },
      { title: '充值金额', value: today.SumPayMergerMoney ?? '0.00' },
      { title: '公司输赢', value: today.FirmBunko ?? '0.00' },
    );
  }
  if (checkPermission(10_520)) {
    items.push(
      { title: '返水金额', value: today.SumBetWaterMoney ?? '0.00' },
      { title: '红利金额', value: today.SumRedSumNum ?? '0.00' },
    );
  }
  if (checkPermission(10_521)) {
    items.push(
      { title: '收入', value: today.Income ?? '0.00' },
      { title: '毛利率', value: `${today.GrossMargin ?? '0.00'}%` },
    );
  }
  return items;
});

function buildQuery() {
  const begin = filters.beginDate;
  const before = filters.beforeDate;
  const beginStr =
    reportType.value === 2
      ? begin.format('YYYY-MM')
      : begin.format('YYYY-MM-DD');
  const beforeStr =
    reportType.value === 2
      ? before.format('YYYY-MM')
      : before.format('YYYY-MM-DD');
  return {
    BeginTime: beginStr,
    /** 日报接口 BeforeTime 为空；月报传对比月 */
    BeforeTime: reportType.value === 2 ? beforeStr : '',
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
    DataSearchType: dataSearchType.value,
    PackageId: filters.PackageId || '',
    ReportType: reportType.value,
  };
}

function recomputeBucket(b: CompareBucket) {
  b.PerCapita = num(b.SumFirstPayMoney)
    ? (num(b.SumFirstPayMoney) / num(b.SumFirstPayNum)).toFixed(2)
    : '0.00';
  b.PercentConversion = num(b.SumReg)
    ? ((num(b.SumFirstPayNum) / num(b.SumReg)) * 100).toFixed(2)
    : '0.00';
  b.SufficientExchange = num(b.SumWithdrawMoney)
    ? (
        (num(b.SumWithdrawMoney) /
          (num(b.SumPayMoney) + num(b.SumAgentPayMoney) || 1)) *
        100
      ).toFixed(2)
    : '0.00';
  const firm = -num(b.SumTransWinMoney1);
  b.FirmBunko = firm.toFixed(2);
  b.Surplus = num(b.SumTransBetMoney1)
    ? ((firm / num(b.SumTransBetMoney1)) * 100).toFixed(2)
    : '0.00';
  b.FullBring = (num(b.SumPayMergerMoney) - num(b.SumWithdrawMoney)).toFixed(2);
  b.Income = (
    -num(b.SumTransWinMoney1) +
    num(b.SumAccountChangeSumNum) -
    num(b.SumRedSumNum) -
    num(b.SumBetWaterMoney) -
    num(b.SumAgentCommissionSumNum)
  ).toFixed(2);
  b.GrossMargin = num(b.SumTransBetMoney1)
    ? ((num(b.Income) / num(b.SumTransBetMoney1)) * 100).toFixed(2)
    : '0.00';
}

async function loadData() {
  loading.value = true;
  try {
    const raw = await fetchDataAnalyzeApi(buildQuery());
    const money = disposeMoneyBuckets(raw as Record<string, CompareBucket>);
    const withFormula = applyCompareFormulas(
      structuredClone(raw) as Record<string, CompareBucket>,
    );
    const merged: Record<string, CompareBucket> = {};
    for (const key of Object.keys({ ...money, ...withFormula })) {
      if (key === 'LastMonthExist') continue;
      merged[key] = {
        ...money[key],
        ...withFormula[key],
      };
      if (money[key]) {
        Object.assign(merged[key]!, {
          SumFirstPayMoney: money[key]!.SumFirstPayMoney,
          SumTransBetMoney1: money[key]!.SumTransBetMoney1,
          SumTransBetValidMoney1: money[key]!.SumTransBetValidMoney1,
          SumTransWinMoney1: money[key]!.SumTransWinMoney1,
          SumWithdrawMoney: money[key]!.SumWithdrawMoney,
          SumPayMoney: money[key]!.SumPayMoney,
          SumPayMergerMoney: money[key]!.SumPayMergerMoney,
          SumAgentPayMoney: money[key]!.SumAgentPayMoney,
          SumBetWaterMoney: money[key]!.SumBetWaterMoney,
          SumApiFeeSumNum: money[key]!.SumApiFeeSumNum,
          SumRedSumNum: money[key]!.SumRedSumNum,
          SumAccountChangeSumNum: money[key]!.SumAccountChangeSumNum,
          SumAgentCommissionSumNum: money[key]!.SumAgentCommissionSumNum,
        });
        recomputeBucket(merged[key]!);
      }
    }
    metricMap.value = merged;
  } catch {
    metricMap.value = {};
    message.error('数据比较加载失败');
  } finally {
    loading.value = false;
  }
}

async function openChart(row: Record<string, unknown>) {
  chartTitle.value = String(row.label || '');
  chartVisible.value = true;
  chartLoading.value = true;
  try {
    const field = String(row.field || '');
    if (reportType.value === 2) {
      // 月报：BeginTime/BeforeTime=YYYY-MM，双序列对齐旧站
      const data = await fetchDataAnalyzeReportApi({
        ...buildQuery(),
        BeginTime: filters.beginDate.format('YYYY-MM'),
        BeforeTime: filters.beforeDate.format('YYYY-MM'),
        Field: field,
      });
      const current = [...((data?.Items || []) as Array<Record<string, unknown>>)]
        .reverse();
      const prev = [
        ...((data?.BeforeDayItems || []) as Array<Record<string, unknown>>),
      ].reverse();
      const xSource = prev.length > current.length ? prev : current;
      chartCategories.value = xSource.map((item) => {
        const day = String(item.ReportDay || '');
        const parts = day.split('-');
        return parts[2] || day;
      });
      const extras = (data?.DayReportExtra || []) as Array<
        Record<string, unknown>
      >;
      const beforeExtras = (data?.BeforeDayReportExtra || []) as Array<
        Record<string, unknown>
      >;
      chartSeries.value = [
        {
          data: current.map((item, i) =>
            resolveChartFieldValue(item, field, extras[i]),
          ),
          name: filters.beginDate.format('YYYY-MM'),
          type: 'line',
        },
        {
          data: prev.map((item, i) =>
            resolveChartFieldValue(item, field, beforeExtras[i]),
          ),
          name: filters.beforeDate.format('YYYY-MM'),
          type: 'line',
        },
      ];
    } else {
      // 日报：当前统计日所在自然月
      const begin = filters.beginDate.startOf('month');
      const end = filters.beginDate.endOf('month');
      const data = await fetchDataAnalyzeReportApi({
        ...buildQuery(),
        BeginTime: begin.format('YYYY-MM-DD'),
        EndTime: end.format('YYYY-MM-DD'),
        Field: field,
      });
      const items = [
        ...((data?.Items || data?.List || []) as Array<Record<string, unknown>>),
      ].reverse();
      const extras = [
        ...((data?.DayReportExtra || []) as Array<Record<string, unknown>>),
      ].reverse();
      chartCategories.value = items.map((item) =>
        String(item.ReportDay || item.Date || item.Day || ''),
      );
      chartSeries.value = [
        {
          data: items.map((item, i) =>
            resolveChartFieldValue(item, field, extras[i]),
          ),
          name: String(row.label),
          type: 'line',
        },
      ];
    }
  } catch {
    chartCategories.value = [];
    chartSeries.value = [];
  } finally {
    chartLoading.value = false;
  }
}

function onReportTypeChange(value: 1 | 2) {
  reportType.value = value;
  if (value === 2) {
    filters.beginDate = dayjs().startOf('month');
    filters.beforeDate = dayjs().subtract(1, 'month').startOf('month');
  } else {
    filters.beginDate = dayjs().subtract(1, 'day');
    filters.beforeDate = dayjs().subtract(1, 'month');
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
          placeholder="当前日期"
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

    <div v-for="section in sections" :key="section.title" class="mb-4">
      <div class="mb-2 text-base font-medium">{{ section.title }}</div>
      <Table
        :columns="reportType === 1 ? dayColumns : monthColumns"
        :data-source="section.rows"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="field"
        size="small"
      >
        <template #bodyCell="{ column, record, text }">
          <template
            v-if="
              [
                'YestDayItems',
                'Day7Items',
                'Day30Items',
                'LastWeekItems',
                'LastMonthItems',
                'CompareMonth',
              ].includes(String(column.key))
            "
          >
            <span :style="{ color: deltaColor(text) }">
              {{ text }}
              <template v-if="Number(String(text).replace('%', '')) > 0">↑</template>
              <template
                v-else-if="Number(String(text).replace('%', '')) < 0"
              >↓</template>
            </span>
          </template>
          <template v-else-if="column.key === 'graph'">
            <a @click="openChart(record)">查看</a>
          </template>
        </template>
      </Table>
    </div>

    <div
      v-if="!loading && sections.length === 0"
      class="py-8 text-center text-gray-400"
    >
      无对应统计区块权限（10518–10521）
    </div>

    <Modal
      v-model:open="chartVisible"
      :footer="null"
      :title="chartTitle"
      width="720px"
    >
      <ReportLineChart
        v-if="!chartLoading"
        :categories="chartCategories"
        :series="chartSeries"
        height="320px"
      />
    </Modal>
  </div>
</template>
