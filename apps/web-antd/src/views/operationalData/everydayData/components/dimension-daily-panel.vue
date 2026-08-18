<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Pagination,
  Radio,
  Select,
  Space,
  Spin,
  Tooltip,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import type { DailyReportRespond } from '#/api/operationalData/everyday-data';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
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
  toDateStrings,
} from '#/utils/everyday-data-date';
import { exportRowsToCsv } from '#/utils/export-csv';
import {
  buildDeviceExportColumns,
  buildVipExportColumns,
  joinMultiValue,
  normalizeSearchValue,
} from '#/utils/everyday-report-format';

import DailyReportTable from './daily-report-table.vue';

defineOptions({ name: 'DimensionDailyPanel' });

const props = defineProps<{
  fetchApi: (query: Record<string, unknown>) => Promise<DailyReportRespond>;
  variant: 'device' | 'vip';
}>();

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();
const cloudStore = useCloudPlatformStore();

const canExport = computed(() => checkPermission(12_171));
const isDevice = computed(() => props.variant === 'device');
const tableVariant = computed(() => props.variant);

const viewMode = ref<1 | 2>(1);
const reportType = ref(1);
const packageId = ref<number | string>('');
const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const dataSearchType = ref(0);
const devicePlatform = ref<Array<string>>([]);
const vipLevel = ref<Array<number | string>>([]);
const dateRange = ref<[Dayjs, Dayjs]>();
const page = ref(1);
const pageSize = ref(15);
const total = ref(0);

const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<DailyReportRow[]>([]);

const isHistory = computed(() => viewMode.value === 2);
const dateFormat = computed(() =>
  reportType.value === 2 ? 'YYYY-MM' : 'YYYY-MM-DD',
);
const pickerMode = computed(() => (reportType.value === 2 ? 'month' : 'date'));

const devicePlatformOptions = computed(() => {
  const map = cloudStore.projectConfig?.DevicePlatformAll || {};
  return Object.entries(map).map(([value, label]) => ({
    label: String(label),
    value,
  }));
});

const vipLevelOptions = computed(() => {
  const list = (cloudStore.projectConfig?.VIPLevelMap || []) as Array<{
    Level?: number | string;
    Name?: string;
  }>;
  return list.map((item) => ({
    label: item.Name || String(item.Level),
    value: item.Level ?? '',
  }));
});

const exportColumns = computed(() =>
  isDevice.value ? buildDeviceExportColumns() : buildVipExportColumns(),
);

const exportFileName = computed(() =>
  isDevice.value ? `设备日报-${isHistory.value ? '历史' : '实时'}` : 'VIP日报',
);

function initDateRange(type = reportType.value) {
  const range =
    type === 2 ? defaultMonthlyReportRange() : defaultDailyReportRange();
  dateRange.value = [dayjs(range[0]), dayjs(range[1])];
}

function buildQuery(
  searchType?: 'old' | 'today',
  extra: Record<string, unknown> = {},
) {
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
    ChannelIds: channelValue,
    ChannelSearch: channelValue,
    ChannelSearchType: channelSearchType.value,
    DataSearchType: dataSearchType.value,
    PackageId: packageId.value || '',
    ReportType: isHistory.value ? reportType.value : 1,
  };

  const { beginTime, endTime } = toDateStrings(
    dateRange.value,
    isHistory.value ? dateFormat.value : 'YYYY-MM-DD',
  );
  query.BeginTime = beginTime;
  query.EndTime = endTime;

  if (isDevice.value) {
    query.DevicePlatform = isHistory.value
      ? joinMultiValue(devicePlatform.value)
      : '';
  } else {
    query.VIPLevel = isHistory.value ? joinMultiValue(vipLevel.value) : '';
  }

  if (searchType === 'old' || (!searchType && isHistory.value)) {
    query.Page = page.value;
    query.PageSize = pageSize.value;
  }

  if (searchType) {
    query.SearchType = searchType;
  }
  Object.assign(query, extra);
  return query;
}

function formatHistoryRow(row: DailyReportRow) {
  return calcDailyReportRow({ ...row }) as DailyReportRow;
}

function normalizeTodayItems(items: unknown): DailyReportRow[] {
  if (!items) return [];
  if (Array.isArray(items)) {
    return calcDailyReportRows(items as DailyReportRow[]);
  }
  return [
    calcDailyReportRow({ ...(items as DailyReportRow) }) as DailyReportRow,
  ];
}

async function loadData() {
  loading.value = true;
  try {
    const data = await props.fetchApi(
      buildQuery(isHistory.value ? 'old' : 'today'),
    );
    if (isHistory.value) {
      const items = calcDailyReportRows(
        (data.Items || []).map((row) => formatHistoryRow(row)),
      );
      total.value = data.Pagination?.MaxCount ?? items.length;
      if (data.BannerItems && Object.keys(data.BannerItems).length > 0) {
        const totalRow = calcDailyReportRow({
          ...data.BannerItems,
          ReportDay: '总计',
          ...(isDevice.value ? { DevicePlatform: '-' } : { VIPLevel: '-' }),
        }) as DailyReportRow;
        tableData.value = [...items, totalRow];
      } else {
        tableData.value = items;
      }
    } else {
      total.value = 0;
      tableData.value = normalizeTodayItems(data.TodayItems);
    }
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  page.value = 1;
  await loadData();
}

function handleReset() {
  reportType.value = 1;
  packageId.value = '';
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  dataSearchType.value = 0;
  devicePlatform.value = [];
  vipLevel.value = [];
  page.value = 1;
  initDateRange(1);
  void loadData();
}

function handleViewModeChange() {
  reportType.value = 1;
  devicePlatform.value = [];
  vipLevel.value = [];
  page.value = 1;
  initDateRange(1);
  void loadData();
}

function handlePageChange(nextPage: number, nextSize: number) {
  page.value = nextPage;
  pageSize.value = nextSize;
  void loadData();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await props.fetchApi(
      buildQuery(isHistory.value ? 'old' : 'today', {
        IsExp: true,
        Page: 1,
        PageSize: 10_000,
      }),
    );
    let rows: DailyReportRow[] = [];
    if (isHistory.value) {
      rows = calcDailyReportRows(
        (data.Items || []).map((row) => formatHistoryRow(row)),
      );
      if (data.BannerItems && Object.keys(data.BannerItems).length > 0) {
        const totalRow = calcDailyReportRow({
          ...data.BannerItems,
          ReportDay: '总计',
          ...(isDevice.value ? { DevicePlatform: '-' } : { VIPLevel: '-' }),
        }) as DailyReportRow;
        rows.push(totalRow);
      }
    } else {
      rows = normalizeTodayItems(data.TodayItems);
    }
    exportRowsToCsv(rows, exportColumns.value, exportFileName.value);
  } finally {
    exportLoading.value = false;
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
  void handleSearch();
});
</script>

<template>
  <div class="flex flex-col ">
    <div class="mb-1">
      <div class="mb-3">
        <Radio.Group
          v-model:value="viewMode"
          @change="handleViewModeChange"
          button-style="solid"
        >
          <Radio.Button :value="1">实时数据</Radio.Button>
          <Radio.Button :value="2">历史数据</Radio.Button>
        </Radio.Group>
      </div>

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
              allow-clear
              placeholder="请选择产品"
            />
          </Space.Compact>

        <div v-if="isDevice && isHistory">
          <Space.Compact>
            <span class="query-field-addon">设备类型</span>
            <Select
              v-model:value="devicePlatform"
              :options="devicePlatformOptions"
              allow-clear
              mode="multiple"
              placeholder="请选择设备类型"
            />
          </Space.Compact>
        </div>

        <div v-if="!isDevice && isHistory">
          <Space.Compact>
            <span class="query-field-addon">VIP等级</span>
            <Select
              v-model:value="vipLevel"
              :options="vipLevelOptions"
              allow-clear
              mode="multiple"
              placeholder="请选择VIP等级"
            />
          </Space.Compact>
        </div>

        <div v-if="isDevice">
          <Space.Compact>
            <span class="query-field-addon">数据类型</span>
            <Select
              v-model:value="dataSearchType"
              :options="memberTypeOptions"
              placeholder="请选择数据类型"
            />
          </Space.Compact>
        </div>

        <Space.Compact v-if="isHistory">
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

        <div v-if="isHistory">
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
        </div>
        
        <div class="query-filter-actions">
          <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button
          v-if="canExport"
          :loading="exportLoading"
          type="primary"
          @click="handleExport"
        >
          导出 Excel
        </Button>
        </div>
    </div>
  </div>
    </div>

    <Card size="small">
      <template #title>
        <Space>
          <span>{{ isHistory ? '历史数据' : '实时数据' }}</span>
          <Tooltip v-if="isDevice" title="使用最后登录设备统计">
            <span class="cursor-help text-gray-400">ⓘ</span>
          </Tooltip>
        </Space>
      </template>
      <Spin :spinning="loading">
        <DailyReportTable :list="tableData" :variant="tableVariant" />
        <div v-if="isHistory" class="mt-3 flex justify-end">
          <Pagination
            :current="page"
            :page-size="pageSize"
            :total="total"
            show-size-changer
            @change="handlePageChange"
          />
        </div>
      </Spin>
    </Card>
  </div>
</template>
