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
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import {
  fetchChannelReportByChannelRawApi,
  fetchChannelReportRawApi,
} from '#/api/operationalData/channel-data';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  calcChannelRow,
  calcChannelRows,
  type ChannelDim,
  type ChannelRow,
} from '#/utils/channel-data-calc';
import {
  defaultDailyReportRange,
  defaultMonthlyReportRange,
  toDateStrings,
} from '#/utils/everyday-data-date';
import { normalizeSearchValue } from '#/utils/everyday-report-format';
import { exportRowsToCsv, type CsvColumn } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

import ChannelReportTable from './channel-report-table.vue';

defineOptions({ name: 'ChannelReportPanel' });

const props = defineProps<{
  /** today | old */
  searchType: 'old' | 'today';
}>();

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();

const isToday = computed(() => props.searchType === 'today');
const canViewAgent = computed(() =>
  isToday.value ? checkPermission(10_665) : checkPermission(10_684),
);
const canViewChannel = computed(() => checkPermission(12_170));
const canExport = computed(() =>
  isToday.value ? checkPermission(10_666) : checkPermission(10_683),
);

const dim = ref<ChannelDim>('agent');
const reportType = ref(1);
const packageId = ref<number | string>('');
const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const agentType = ref<number | string>('');
const dataSearchType = ref(0);
const dateRange = ref<[Dayjs, Dayjs]>();

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<ChannelRow[]>([]);

const dateFormat = computed(() =>
  reportType.value === 2 ? 'YYYY-MM' : 'YYYY-MM-DD',
);
const pickerMode = computed(() => (reportType.value === 2 ? 'month' : 'date'));

/** 区间报日期列：查询起止，对齐旧站 param.BeginTime~param.EndTime */
const queryDateLabel = computed(() => {
  const { beginTime, endTime } = toDateStrings(
    dateRange.value,
    dateFormat.value,
  );
  if (!beginTime && !endTime) return '';
  return `${beginTime}~${endTime}`;
});

const showAgentRadio = computed(() => canViewAgent.value);
const showChannelRadio = computed(() => canViewChannel.value);

function initDateRange(type = reportType.value) {
  if (isToday.value) {
    const range = defaultDailyReportRange();
    dateRange.value = [dayjs(range[0]), dayjs(range[1])];
    return;
  }
  if (type === 2) {
    const range = defaultMonthlyReportRange();
    dateRange.value = [dayjs(range[0]), dayjs(range[1])];
    return;
  }
  // 历史日报默认：昨天～昨天（对齐旧站常见区间；旧站搜索组件默认会带回区间）
  const yesterday = dayjs().subtract(1, 'day');
  dateRange.value = [yesterday, yesterday];
}

function resolveDimDefault() {
  if (canViewAgent.value) {
    dim.value = 'agent';
  } else if (canViewChannel.value) {
    dim.value = 'channel';
  }
}

function buildQuery(extra?: Record<string, unknown>) {
  const adminValue = normalizeSearchValue(
    adminSearch.value,
    adminSearchType.value,
  );
  const channelValue = normalizeSearchValue(
    channelSearch.value,
    channelSearchType.value,
  );
  const { beginTime, endTime } = toDateStrings(
    dateRange.value,
    dateFormat.value,
  );

  return {
    AdminGroupIds: '',
    AdminIds: adminValue,
    AdminSearch: adminValue,
    AdminSearchType: adminSearchType.value,
    AgentType: agentType.value === '' ? '' : agentType.value,
    BeginTime: beginTime,
    ChannelIds: channelValue,
    ChannelSearch: channelValue,
    ChannelSearchType: channelSearchType.value,
    DataSearchType: dataSearchType.value,
    EndTime: endTime,
    PackageId: packageId.value || '',
    Page: page.value,
    PageSize: pageSize.value,
    ReportType: isToday.value ? 1 : reportType.value,
    SearchType: props.searchType,
    Sort: isToday.value ? '-sum_bet_game_money' : '-ReportDay',
    ...extra,
  };
}

async function loadData() {
  if (dim.value === 'agent' && !canViewAgent.value) return;
  if (dim.value === 'channel' && !canViewChannel.value) return;

  loading.value = true;
  try {
    const fetchApi =
      dim.value === 'agent'
        ? fetchChannelReportRawApi
        : fetchChannelReportByChannelRawApi;
    const data = await fetchApi(buildQuery());
    // 对齐旧站字段：今日/渠道维用 RealTimeItems；历史代理维用 Items
    const rawItems = (
      isToday.value || dim.value === 'channel'
        ? data.RealTimeItems || data.Items || []
        : data.Items || data.RealTimeItems || []
    ) as ChannelRow[];
    const rows = calcChannelRows(rawItems, dim.value);
    total.value = data.Pagination?.MaxCount ?? rows.length;

    const totalSource =
      dim.value === 'channel'
        ? data.TotalRealTimeItems || data.TotalItems
        : data.TotalItems || data.TotalRealTimeItems;
    if (!isToday.value && totalSource && Object.keys(totalSource).length > 0) {
      const totalRow = calcChannelRow(
        {
          ...totalSource,
          ReportDay: '总计',
          Username: '-',
          Agentname: '-',
          ChannelId: '-',
          PackageName: '-',
        },
        dim.value,
      );
      tableData.value = [...rows, totalRow];
    } else {
      tableData.value = rows;
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
  agentType.value = '';
  dataSearchType.value = 0;
  page.value = 1;
  initDateRange(1);
  void loadData();
}

function handleDimChange() {
  adminSearch.value = [];
  channelSearch.value = [];
  agentType.value = '';
}

function handlePageChange(nextPage: number, nextSize: number) {
  page.value = nextPage;
  pageSize.value = nextSize;
  void loadData();
}

function buildExportColumns(): CsvColumn<ChannelRow>[] {
  const cols: CsvColumn<ChannelRow>[] = [];
  if (!isToday.value) {
    cols.push({
      header: '日期',
      value: (row) => String(row.ReportDay || ''),
    });
  }
  if (dim.value === 'agent') {
    cols.push(
      { header: '代理账号', value: (row) => String(row.Username || '') },
      { header: '代理名称', value: (row) => String(row.Agentname || '') },
      {
        header: '代理类型',
        value: (row) => {
          const type = Number(row.AgentType || 0);
          if (type === 1) return '普通';
          if (type === 2) return '官方';
          return '-';
        },
      },
    );
  } else {
    cols.push(
      { header: '渠道号', value: (row) => String(row.ChannelId || '') },
      { header: '所属代理', value: (row) => String(row.Username || '') },
      { header: '所属产品', value: (row) => String(row.PackageName || '') },
    );
  }
  cols.push(
    { header: '新增设备', value: (row) => Number(row.SumDevice || 0) },
    { header: '注册账号', value: (row) => Number(row.SumReg || 0) },
    { header: '首存人数', value: (row) => Number(row.SumFirstPayNum || 0) },
    {
      header: '转化率(%)',
      value: (row) => `${row.PercentConversion || 0}%`,
    },
    {
      header: '首存金额',
      value: (row) => formatAmountFromCent(Number(row.SumFirstPayMoney || 0)),
    },
    {
      header: '人均首存',
      value: (row) =>
        formatAmountFromCent(Number(row.AverageFirstPayMoney || 0)),
    },
    { header: '登录账户', value: (row) => Number(row.SumLogin || 0) },
    { header: '存款人数', value: (row) => Number(row.SumPayMergerNum || 0) },
    { header: '取款人数', value: (row) => Number(row.SumWithdrawNum || 0) },
    {
      header: '存款金额',
      value: (row) => formatAmountFromCent(Number(row.SumPayMergerMoney || 0)),
    },
    {
      header: '取款金额',
      value: (row) => formatAmountFromCent(Number(row.SumWithdrawMoney || 0)),
    },
    {
      header: '存提差',
      value: (row) =>
        formatAmountFromCent(Number(row.DiffPayWithdrawMoney || 0)),
    },
    {
      header: '提存率(%)',
      value: (row) => `${row.PercentPayWithdraw || 0}%`,
    },
    { header: '投注人数', value: (row) => Number(row.SumTransBetNum1 || 0) },
    {
      header: '投注金额',
      value: (row) => formatAmountFromCent(Number(row.SumTransBetMoney1 || 0)),
    },
    {
      header: '有效投注',
      value: (row) =>
        formatAmountFromCent(Number(row.SumTransBetValidMoney1 || 0)),
    },
    {
      header: '派送金额',
      value: (row) => formatAmountFromCent(Number(row.SumTransWinMoney1 || 0)),
    },
    {
      header: '公司输赢',
      value: (row) => formatAmountFromCent(Number(row.CompanyProfitMoney || 0)),
    },
    {
      header: '盈余比例(%)',
      value: (row) => `${row.PercentProfit || 0}%`,
    },
    {
      header: '账户调整',
      value: (row) =>
        formatAmountFromCent(Number(row.AccountAdjustDisplay || 0)),
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
      header: '公司收入',
      value: (row) => formatAmountFromCent(Number(row.CompanyIncomeMoney || 0)),
    },
  );
  return cols;
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const fetchApi =
      dim.value === 'agent'
        ? fetchChannelReportRawApi
        : fetchChannelReportByChannelRawApi;
    const data = await fetchApi(
      buildQuery({ Page: 1, PageSize: 10_000, IsExp: true }),
    );
    const rawItems = (
      isToday.value || dim.value === 'channel'
        ? data.RealTimeItems || data.Items || []
        : data.Items || data.RealTimeItems || []
    ) as ChannelRow[];
    const rows = calcChannelRows(rawItems, dim.value);
    const name = `${isToday.value ? '今日' : '历史'}-${dim.value === 'agent' ? '代理数据' : '渠道数据'}`;
    exportRowsToCsv(rows, buildExportColumns(), name);
  } finally {
    exportLoading.value = false;
  }
}

watch(reportType, (value) => {
  if (!isToday.value) initDateRange(value);
});

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});

watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

watch(dim, () => {
  page.value = 1;
  void loadData();
});

onMounted(() => {
  resolveDimDefault();
  initDateRange();
  void loadData();
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
              allow-clear
              placeholder="请选择产品"
            />
          </Space.Compact>

        <div v-if="dim === 'agent'">
          <Space.Compact>
            <span class="query-field-addon">代理类型</span>
            <Select
              v-model:value="agentType"
              :options="[
                { label: '全部', value: '' },
                { label: '普通', value: 1 },
                { label: '官方', value: 2 },
              ]"
              placeholder="请选择代理类型"
            />
          </Space.Compact>
        </div>

        <Space.Compact>
            <span class="query-field-addon">数据类型</span>
            <Select
              v-model:value="dataSearchType"
              :options="memberTypeOptions"
              placeholder="请选择数据类型"
            />
          </Space.Compact>

        <template v-if="!isToday">
          <Space.Compact>
            <span class="query-field-addon">报表类型</span>
            <Select
              v-model:value="reportType"
              :options="[
                { label: '日报', value: 1 },
                { label: '月报', value: 2 },
                { label: '区间', value: 3 },
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
        
        </template>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        </div>
    </div>
  </div>

    <Card size="small">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Radio.Group
          v-model:value="dim"
          button-style="solid"
          @change="handleDimChange"
        >
          <Radio.Button v-if="showAgentRadio" value="agent">
            代理数据
          </Radio.Button>
          <Radio.Button v-if="showChannelRadio" value="channel">
            渠道数据
          </Radio.Button>
        </Radio.Group>
        <Button
          v-if="canExport"
          :loading="exportLoading"
          type="primary"
          @click="handleExport"
        >
          导出 Excel
        </Button>
      </div>

      <Spin :spinning="loading">
        <div
          v-if="
            (dim === 'agent' && !canViewAgent) ||
            (dim === 'channel' && !canViewChannel)
          "
          class="py-10 text-center text-gray-400"
        >
          无当前维度表格权限
        </div>
        <template v-else>
          <ChannelReportTable
            :dim="dim"
            :list="tableData"
            :mode="isToday ? 'today' : 'history'"
            :query-date-label="queryDateLabel"
            :report-type="reportType"
          />
          <div class="mt-3 flex justify-end">
            <Pagination
              :current="page"
              :page-size="pageSize"
              :total="total"
              show-size-changer
              @change="handlePageChange"
            />
          </div>
        </template>
      </Spin>
    </Card>
  </div>
</template>
