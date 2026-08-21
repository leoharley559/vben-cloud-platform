<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { IosAppStoreItem } from '#/api/operationalData/everyday-data';
import type { DailyReportRow } from '#/utils/everyday-data-calc';
import type { CsvColumn } from '#/utils/export-csv';

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
import dayjs from 'dayjs';

import { fetchIosAppStoreDataApi, fetchIosAppStoreListApi, fetchIosAppStoreTodayExportApi } from '#/api/operationalData/everyday-data';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { calcDailyReportRow, calcDailyReportRows } from '#/utils/everyday-data-calc';
import {
  defaultDailyReportRange,
  defaultMonthlyReportRange,
  toDateStrings,
} from '#/utils/everyday-data-date';
import {
  buildPackageStyleExportColumns,
  joinMultiValue,
  normalizeSearchValue,
} from '#/utils/everyday-report-format';
import { exportRowsToCsv } from '#/utils/export-csv';

import DailyReportTable from './daily-report-table.vue';

defineOptions({ name: 'PackageDailyPanel' });

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();

const canRealtime = computed(() => checkPermission(10_696));
const canHistory = computed(() => checkPermission(10_697));
const canExport = computed(() => checkPermission(10_698));
const canExportToday = computed(() => checkPermission(12_021));

const reportType = ref(1);
const packageId = ref<number | string>('');
const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const appUrl = ref<Array<string>>([]);
const dataSearchType = ref(0);
const dateRange = ref<[Dayjs, Dayjs]>();

const loading = ref(false);
const todayExportLoading = ref(false);
const appUrlOptions = ref<Array<{ label: string; value: string }>>([]);
const realTimeData = ref<DailyReportRow[]>([]);
const historyData = ref<DailyReportRow[]>([]);

const dateFormat = computed(() =>
  reportType.value === 2 ? 'YYYY-MM' : 'YYYY-MM-DD',
);
const pickerMode = computed(() => (reportType.value === 2 ? 'month' : 'date'));

const exportColumns = buildPackageStyleExportColumns('推广收入');

const todayExportColumns: CsvColumn<DailyReportRow>[] = [
  {
    header: '上架包',
    value: (row) => String(row.AppStoreKeyName || ''),
  },
  ...exportColumns,
];

function initDateRange(type = reportType.value) {
  const range =
    type === 2 ? defaultMonthlyReportRange() : defaultDailyReportRange();
  dateRange.value = [dayjs(range[0]), dayjs(range[1])];
}

function buildQuery() {
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
  return {
    AdminGroupIds: '',
    AdminIds: adminValue,
    AdminSearch: adminValue,
    AdminSearchType: adminSearchType.value,
    AppUrl: joinMultiValue(appUrl.value),
    BeginTime: beginTime,
    ChannelIds: channelValue,
    ChannelSearch: channelValue,
    ChannelSearchType: channelSearchType.value,
    DataSearchType: dataSearchType.value,
    EndTime: endTime,
    PackageId: packageId.value || '',
    ReportType: reportType.value,
  };
}

async function loadAppUrlOptions() {
  try {
    const data = await fetchIosAppStoreListApi();
    appUrlOptions.value = (data.Items || []).map((item: IosAppStoreItem) => ({
      label: item.AppName || item.AppUrl || String(item.Id || ''),
      value: String(item.AppUrl || ''),
    }));
  } catch {
    appUrlOptions.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    const data = await fetchIosAppStoreDataApi(buildQuery());
    const todayRow = data.TodayItems
      ? (calcDailyReportRow({ ...data.TodayItems }) as DailyReportRow)
      : null;
    realTimeData.value = todayRow ? [todayRow] : [];

    const items = calcDailyReportRows((data.Items || []) as DailyReportRow[]);
    items.sort((a, b) =>
      String(b.ReportDay || '').localeCompare(String(a.ReportDay || '')),
    );

    if (data.BannerItems && Object.keys(data.BannerItems).length > 0) {
      const totalRow = calcDailyReportRow({
        ...data.BannerItems,
        ReportDay: '总计',
      }) as DailyReportRow;
      historyData.value = [...items, totalRow];
    } else {
      historyData.value = items;
    }
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  await loadData();
}

function handleReset() {
  reportType.value = 1;
  packageId.value = '';
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  appUrl.value = [];
  dataSearchType.value = 0;
  initDateRange(1);
  void handleSearch();
}

function handleExportHistory() {
  exportRowsToCsv(historyData.value, exportColumns, '上架包日报-历史数据');
}

async function handleExportToday() {
  todayExportLoading.value = true;
  try {
    const { endTime } = toDateStrings(dateRange.value, dateFormat.value);
    const data = await fetchIosAppStoreTodayExportApi({
      BeginTime: endTime,
      EndTime: endTime,
      IsExp: true,
    });
    const rows = calcDailyReportRows((data.Items || []) as DailyReportRow[]);
    exportRowsToCsv(rows, todayExportColumns, '上架包今日数据');
  } finally {
    todayExportLoading.value = false;
  }
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

onMounted(() => {
  initDateRange();
  void loadAppUrlOptions();
  void handleSearch();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="ops-query-scope mb-3">
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
          <AccountSelect v-if="adminSearchType === 0" v-model="adminSearch" />
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
            allow-clear
            placeholder="请选择产品"
          />
        </Space.Compact>

        <Space.Compact>
          <span class="query-field-addon">上架包</span>
          <Select
            v-model:value="appUrl"
            :options="appUrlOptions"
            allow-clear
            mode="multiple"
            placeholder="请选择上架包"
          />
        </Space.Compact>

        <Space.Compact>
          <span class="query-field-addon">数据类型</span>
          <Select
            v-model:value="dataSearchType"
            :options="memberTypeOptions"
            placeholder="请选择数据类型"
          />
        </Space.Compact>

        <Space.Compact>
          <span class="query-field-addon">报表类型</span>
          <Select
            v-model:value="reportType"
            :options="[
              { label: '日报', value: 1 },
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
    <div class="mb-3">
    <Card v-if="canRealtime" size="small" title="实时数据">
      <Spin :spinning="loading">
        <DailyReportTable :list="realTimeData" variant="package" />
      </Spin>
    </Card>
    </div>
    <Card v-if="canHistory" size="small" title="历史数据">
      <Spin :spinning="loading">
        <DailyReportTable :list="historyData" variant="package" />
      </Spin>
    </Card>
  </div>
</template>
