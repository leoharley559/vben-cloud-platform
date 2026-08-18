<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Spin,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import {
  fetchDailyReportApi,
  fetchDailyReportStatisticsApi,
} from '#/api/operationalData/everyday-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  calcDailyReportRow,
  calcDailyReportRows,
  type DailyReportRow,
} from '#/utils/everyday-data-calc';
import {
  defaultDailyReportRange,
  defaultMonthlyReportRange,
  defaultWeeklyReportRange,
  formatWeekReportDay,
  toDateStrings,
} from '#/utils/everyday-data-date';
import { exportRowsToCsv, type CsvColumn } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

import DailyReportLineChart from './daily-report-line-chart.vue';
import DailyReportTable from './daily-report-table.vue';

defineOptions({ name: 'DailyReportPanel' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const cloudStore = useCloudPlatformStore();

const adminType = computed(() => {
  const parentInfo = cloudStore.projectConfig?.ParentInfo as
    | { AdminType?: number }
    | undefined;
  return Number(parentInfo?.AdminType ?? 1);
});

const canChart = computed(() => checkPermission(10_706));
const canRealtime = computed(() => checkPermission(10_713));
const canHistory = computed(() => checkPermission(10_714));
const canExport = computed(() => checkPermission(10_853));

const chartTabPermissions = computed(() => ({
  betMoney: checkPermission(10_707),
  betNum: checkPermission(10_708),
  payMoney: checkPermission(10_710),
  payNum: checkPermission(10_711),
  pay_withdraw: checkPermission(10_712),
  profit: checkPermission(10_709),
}));

const reportType = ref(1);
const packageId = ref<number | string>('');
const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const dateRange = ref<[Dayjs, Dayjs]>();

const realTimeLoading = ref(false);
const historyLoading = ref(false);
const realTimeData = ref<DailyReportRow[]>([]);
const historyData = ref<DailyReportRow[]>([]);
const chartList = ref<DailyReportRow[]>([]);
const arppuTotal = ref('0');

const dateFormat = computed(() =>
  reportType.value === 2 ? 'YYYY-MM' : 'YYYY-MM-DD',
);
const pickerMode = computed(() => (reportType.value === 2 ? 'month' : 'date'));

function initDateRange(type = reportType.value) {
  let range: [string, string];
  if (type === 2) {
    range = defaultMonthlyReportRange();
  } else if (type === 4) {
    range = defaultWeeklyReportRange();
  } else {
    range = defaultDailyReportRange();
  }
  dateRange.value = [dayjs(range[0]), dayjs(range[1])];
}

function normalizeSearchValue(
  value: Array<number | string> | number | string,
  searchType: number,
) {
  if (searchType === 0 && Array.isArray(value)) {
    return value.join(',');
  }
  return value ?? '';
}

function buildQuery(searchType?: 'old' | 'today') {
  const { beginTime, endTime } = toDateStrings(
    dateRange.value,
    dateFormat.value,
  );
  const adminValue = normalizeSearchValue(
    adminSearch.value,
    adminSearchType.value,
  );
  const channelValue = normalizeSearchValue(
    channelSearch.value,
    channelSearchType.value,
  );
  const query: Record<string, unknown> = {
    AdminGroupIds: '',
    AdminIds: adminValue,
    AdminSearch: adminValue,
    AdminSearchType: adminSearchType.value,
    BeginTime: beginTime,
    ChannelIds: channelValue,
    ChannelSearch: channelValue,
    ChannelSearchType: channelSearchType.value,
    EndTime: endTime,
    PackageId: packageId.value || '',
    ReportType: reportType.value,
  };
  if (searchType) {
    query.SearchType = searchType;
  }
  return query;
}

function formatHistoryRow(row: DailyReportRow) {
  const next = calcDailyReportRow({ ...row }) as DailyReportRow;
  if (reportType.value === 4 && next.ReportDay) {
    next.ReportDay = formatWeekReportDay(String(next.ReportDay));
  }
  return next;
}

async function loadRealtime() {
  if (!canRealtime.value) return;
  realTimeLoading.value = true;
  try {
    const data = await fetchDailyReportApi(buildQuery('today'));
    const row = data.TodayItems
      ? (calcDailyReportRow({ ...data.TodayItems }) as DailyReportRow)
      : null;
    realTimeData.value = row ? [row] : [];
  } finally {
    realTimeLoading.value = false;
  }
}

async function loadHistory() {
  if (!canHistory.value) return;
  historyLoading.value = true;
  try {
    const data = await fetchDailyReportApi(buildQuery('old'));
    const items = calcDailyReportRows(
      (data.Items || []).map((row) => formatHistoryRow(row)),
    );
    historyData.value = items;
    chartList.value = [...items].sort((a, b) =>
      String(a.ReportDay || '').localeCompare(String(b.ReportDay || '')),
    );
    await loadStatistics();
  } finally {
    historyLoading.value = false;
  }
}

async function loadStatistics() {
  if (!historyData.value.length) {
    arppuTotal.value = '0';
    return;
  }
  try {
    const stats = await fetchDailyReportStatisticsApi(buildQuery('old'));
    const totalRow = calcDailyReportRow({
      ...(stats.BannerItems || {}),
      ReportDay: '总计',
    }) as DailyReportRow;
    arppuTotal.value = String(totalRow.Arppu || '0');
    historyData.value = [
      ...historyData.value.filter((row) => row.ReportDay !== '总计'),
      totalRow,
    ];
  } catch {
    arppuTotal.value = '0';
  }
}

async function handleSearch() {
  await Promise.all([loadRealtime(), loadHistory()]);
}

function handleReset() {
  reportType.value = 1;
  packageId.value = '';
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  initDateRange(1);
  void handleSearch();
}

watch(reportType, (value) => {
  initDateRange(value);
});

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});

watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

const exportColumns: CsvColumn<DailyReportRow>[] = [
  { header: '日期', value: (row) => String(row.ReportDay || '') },
  { header: '新增访问', value: (row) => Number(row.SumDevice || 0) },
  { header: '注册账号', value: (row) => Number(row.SumReg || 0) },
  { header: '首存人数', value: (row) => Number(row.SumFirstPayNum || 0) },
  { header: '转化率(%)', value: (row) => `${row.PercentConversion || 0}%` },
  {
    header: '首存金额(元)',
    value: (row) => formatAmountFromCent(Number(row.SumFirstPayMoney || 0)),
  },
  {
    header: '人均首存(元)',
    value: (row) => formatAmountFromCent(Number(row.AverageFirstPayMoney || 0)),
  },
  { header: '登录账户', value: (row) => Number(row.SumLogin || 0) },
  { header: '存款人数', value: (row) => Number(row.SumPayMergerNum || 0) },
  { header: '取款人数', value: (row) => Number(row.SumWithdrawNum || 0) },
  {
    header: '存款金额(元)',
    value: (row) => formatAmountFromCent(Number(row.SumPayMergerMoney || 0)),
  },
  {
    header: '取款金额(元)',
    value: (row) => formatAmountFromCent(Number(row.SumWithdrawMoney || 0)),
  },
  {
    header: '存提差(元)',
    value: (row) => formatAmountFromCent(Number(row.DiffPayWithdrawMoney || 0)),
  },
  {
    header: '提存率(%)',
    value: (row) => `${row.PercentPayWithdraw || 0}%`,
  },
  { header: '投注人数', value: (row) => Number(row.SumTransBetNum1 || 0) },
  {
    header: '投注金额(元)',
    value: (row) => formatAmountFromCent(Number(row.SumTransBetMoney1 || 0)),
  },
  {
    header: '有效投注额(元)',
    value: (row) =>
      formatAmountFromCent(Number(row.SumTransBetValidMoney1 || 0)),
  },
  {
    header: '派送金额(元)',
    value: (row) => formatAmountFromCent(Number(row.SumTransWinMoney1 || 0)),
  },
  {
    header: '公司输赢',
    value: (row) => formatAmountFromCent(Number(row.CompanyProfitMoney || 0)),
  },
  { header: '盈余比例(%)', value: (row) => `${row.PercentProfit || 0}%` },
  {
    header: '账户调整',
    value: (row) =>
      formatAmountFromCent(-Number(row.SumAccountChangeSumNum || 0)),
  },
  {
    header: '红利',
    value: (row) => formatAmountFromCent(Number(row.SumRedSumNum || 0)),
  },
  {
    header: '返水',
    value: (row) => formatAmountFromCent(Number(row.SumBetWaterMoney || 0)),
  },
  {
    header: '代理佣金',
    value: (row) =>
      formatAmountFromCent(Number(row.SumAgentCommissionSumNum || 0)),
  },
  {
    header: '公司收入',
    value: (row) => formatAmountFromCent(Number(row.CompanyIncomeMoney || 0)),
  },
];

function handleExport() {
  exportRowsToCsv(historyData.value, exportColumns, '日报-历史数据');
}

onMounted(() => {
  initDateRange();
  void handleSearch();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="ops-query-scope mb-1">
    <div class="ops-query-filters">
          <Space.Compact>
          <Select
            class="query-auto-select"
            :popup-match-select-width="false"
            v-model:value="adminSearchType"
            :options="[
              { label: '账号模糊', value: 0 },
              { label: '账号精准', value: 1 },
            ]"
          />
          <AccountSelect
            v-if="adminSearchType === 0"
            v-model="adminSearch"
          />
          <Input
            v-else
            v-model:value="adminSearch as string"
            allow-clear
            placeholder="请输入账号"
          />
        </Space.Compact>

        <Space.Compact>
          <Select
            class="query-auto-select"
            :popup-match-select-width="false"
            v-model:value="channelSearchType"
            :options="[
              { label: '渠道模糊', value: 0 },
              { label: '渠道精准', value: 1 },
            ]"
          />
          <ChannelSelect
            v-if="channelSearchType === 0"
            v-model="channelSearch"
            placeholder="请输入渠道号"
          />
          <Input
            v-else
            v-model:value="channelSearch as string"
            allow-clear
            placeholder="请输入渠道"
          />
        </Space.Compact>

        <Space.Compact>
            <span class="query-field-addon">产品</span>
            <Select
              v-model:value="packageId"
              :options="
                packageOptions.map((item) => ({
                  label: item.PackageName,
                  value: item.PackageId,
                }))
              "
              placeholder="请选择产品"
            />
          </Space.Compact>

        <Space.Compact>
          <span class="query-field-addon">报表类型</span>
          <Select
            v-model:value="reportType"
            :options="[
              { label: '日报', value: 1 },
              { label: '周报', value: 4 },
              { label: '月报', value: 2 },
            ]"
            placeholder="请选择报表类型"
          />
        </Space.Compact>

        <div class="query-filter-wide">
          <Space.Compact>
            <span class="query-field-addon">日期</span>
            <DatePicker.RangePicker
              v-model:value="dateRange"
              :format="dateFormat"
              :picker="pickerMode"
            />
          </Space.Compact>
        </div>
        
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        </div>
    </div>
  </div>
    <Card v-if="canChart" size="small" title="趋势图">
      <Spin :spinning="historyLoading">
        <DailyReportLineChart
          :admin-type="adminType"
          :tab-list="chartList"
          :visible-tabs="chartTabPermissions"
        />
      </Spin>
    </Card>

    <Card v-if="canRealtime" size="small" title="实时数据">
      <Spin :spinning="realTimeLoading">
        <DailyReportTable :list="realTimeData" />
      </Spin>
    </Card>

    <Card v-if="canHistory" size="small" title="历史数据">
      <Spin :spinning="historyLoading">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="text-sm">
            <span class="text-gray-500">ARPPU：</span>
            <span class="font-medium">{{ arppuTotal }}</span>
          </div>
          <Button v-if="canExport" type="primary" @click="handleExport">
            导出 Excel
          </Button>
        </div>
        <DailyReportTable :list="historyData" />
      </Spin>
    </Card>
  </div>
</template>
