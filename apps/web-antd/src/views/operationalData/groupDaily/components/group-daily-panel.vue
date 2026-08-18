<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Card,
  Cascader,
  DatePicker,
  Pagination,
  Select,
  Space,
  Spin,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import {
  fetchAgentGroupDailyReportApi,
  fetchAgentGroupListApi,
  type AgentGroupNode,
} from '#/api/operationalData/group-daily';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { calcDailyReportRow } from '#/utils/everyday-data-calc';
import { exportRowsToCsv, type CsvColumn } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  applyGroupDrillStyles,
  buildParentTreeState,
  calcGroupDailyRows,
  defaultGroupDailyRange,
  defaultGroupMonthlyRange,
  normalizeGroupTree,
  type GroupDailyRow,
} from '#/utils/group-daily';

import GroupDailyTable from './group-daily-table.vue';

defineOptions({ name: 'GroupDailyPanel' });

const { checkPermission } = useCloudPermission();
const { memberTypeOptions } = useOperationOptions();

const canExport = computed(() => checkPermission(10_687));

const reportType = ref(1);
const dataSearchType = ref(0);
const dateRange = ref<[Dayjs, Dayjs]>();
const groupTemp = ref<Array<Array<number | string>>>([]);
const groupOptions = ref<AgentGroupNode[]>([]);
const level = ref(0);
const parentTreeStr = ref('');
const showAgentCount = ref(true);

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<GroupDailyRow[]>([]);

const dateFormat = computed(() =>
  reportType.value === 2 ? 'YYYY-MM' : 'YYYY-MM-DD',
);
const pickerMode = computed(() => (reportType.value === 2 ? 'month' : 'date'));

function initDateRange(type = reportType.value) {
  const range =
    type === 2 ? defaultGroupMonthlyRange() : defaultGroupDailyRange();
  dateRange.value = [dayjs(range[0]), dayjs(range[1])];
}

function syncGroupFilter(keepLevel?: number) {
  const state = buildParentTreeState(groupTemp.value, keepLevel);
  parentTreeStr.value = state.parentTreeStr;
  if (keepLevel === undefined) {
    level.value = state.level;
  }
  showAgentCount.value =
    keepLevel === 4 ? false : state.showAgentCount && level.value !== 4;
}

function buildQuery(extra?: Record<string, unknown>) {
  const begin = dateRange.value?.[0]?.format(dateFormat.value) || '';
  const end = dateRange.value?.[1]?.format(dateFormat.value) || '';
  return {
    BeginTime: begin,
    DataSearchType: dataSearchType.value,
    EndTime: end,
    Level: level.value,
    Page: page.value,
    PageSize: pageSize.value,
    ParentTreeStr: parentTreeStr.value,
    ReportType: reportType.value,
    ...extra,
  };
}

async function loadGroupOptions() {
  try {
    const data = await fetchAgentGroupListApi({ IsTop: 1 });
    groupOptions.value = normalizeGroupTree(data.Items || []);
  } catch {
    groupOptions.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [listRes, totalRes] = await Promise.all([
      fetchAgentGroupDailyReportApi(buildQuery()),
      fetchAgentGroupDailyReportApi(buildQuery({ SearchType: 'total' })),
    ]);

    const rows = applyGroupDrillStyles(
      calcGroupDailyRows(listRes.Items || []),
      level.value,
    );
    total.value = listRes.Pagination?.MaxCount ?? rows.length;

    if (totalRes.BannerItems && Object.keys(totalRes.BannerItems).length > 0) {
      const totalRow = calcDailyReportRow({
        ...totalRes.BannerItems,
        ReportDay: '总计',
        GroupName1: '-',
        GroupName2: '-',
        GroupName3: '-',
        GroupName: '-',
        AgentCount: '-',
        Username: '-',
        Name: '-',
      }) as GroupDailyRow;
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
  syncGroupFilter();
  if (groupTemp.value.some((item) => item.length > 3)) {
    showAgentCount.value = false;
  }
  await loadData();
}

function handleReset() {
  reportType.value = 1;
  dataSearchType.value = 0;
  groupTemp.value = [];
  parentTreeStr.value = '';
  level.value = 0;
  showAgentCount.value = true;
  page.value = 1;
  initDateRange(1);
  void loadData();
}

function handleGroupChange() {
  syncGroupFilter();
  if (groupTemp.value.some((item) => item.length > 3)) {
    showAgentCount.value = false;
  } else if (level.value !== 4) {
    showAgentCount.value = true;
  }
}

function handleDrill(row: GroupDailyRow, drillLevel: 1 | 2 | 3 | 4) {
  if (drillLevel === 1 && row.GroupStyle1) {
    level.value = 1;
    groupTemp.value = [[row.GroupId1 as number | string]];
    showAgentCount.value = true;
  } else if (drillLevel === 2 && row.GroupStyle2 && row.GroupStyle1) {
    level.value = 2;
    groupTemp.value = [
      [row.GroupId1 as number | string, row.GroupId2 as number | string],
    ];
    showAgentCount.value = true;
  } else if (
    drillLevel === 3 &&
    row.GroupStyle3 &&
    row.GroupStyle2 &&
    row.GroupStyle1
  ) {
    level.value = 3;
    groupTemp.value = [
      [
        row.GroupId1 as number | string,
        row.GroupId2 as number | string,
        row.GroupId3 as number | string,
      ],
    ];
    showAgentCount.value = true;
  } else if (
    drillLevel === 4 &&
    row.GroupStyle &&
    row.GroupStyle3 &&
    row.GroupStyle2 &&
    row.GroupStyle1
  ) {
    level.value = 4;
    groupTemp.value = [
      [
        row.GroupId1 as number | string,
        row.GroupId2 as number | string,
        row.GroupId3 as number | string,
        row.GroupId as number | string,
      ],
    ];
    showAgentCount.value = false;
  } else {
    return;
  }
  syncGroupFilter(level.value);
  page.value = 1;
  void loadData();
}

function handlePageChange(nextPage: number, nextSize: number) {
  page.value = nextPage;
  pageSize.value = nextSize;
  void loadData();
}

function buildExportColumns(): CsvColumn<GroupDailyRow>[] {
  const cols: CsvColumn<GroupDailyRow>[] = [
    { header: '日期', value: (row) => String(row.ReportDay || '') },
    { header: '一级', value: (row) => String(row.GroupName1 || '') },
    { header: '二级', value: (row) => String(row.GroupName2 || '') },
    { header: '三级', value: (row) => String(row.GroupName3 || '') },
    { header: '四级', value: (row) => String(row.GroupName || '') },
  ];
  if (showAgentCount.value) {
    cols.push({
      header: '单元代理人数',
      value: (row) => Number(row.AgentCount || 0),
    });
  } else {
    cols.push(
      { header: '代理编号', value: (row) => String(row.Username || '') },
      { header: '代理名称', value: (row) => String(row.Name || '') },
    );
  }
  cols.push(
    { header: '注册人数', value: (row) => Number(row.SumReg || 0) },
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
  );
  if (reportType.value === 2) {
    cols.push({
      header: '净输赢',
      value: (row) => formatAmountFromCent(Number(row.RealCleanMoney || 0)),
    });
  }
  cols.push(
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
  );
  if (reportType.value === 2) {
    cols.push({
      header: '场馆费用',
      value: (row) => formatAmountFromCent(Number(row.SumApiFeeSumNum || 0)),
    });
  }
  cols.push(
    {
      header: '代理佣金',
      value: (row) =>
        formatAmountFromCent(Number(row.SumAgentCommissionSumNum || 0)),
    },
    {
      header: '推广收入',
      value: (row) => formatAmountFromCent(Number(row.CompanyIncomeMoney || 0)),
    },
  );
  return cols;
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await fetchAgentGroupDailyReportApi(
      buildQuery({ IsExp: true, Page: 1, PageSize: 10_000 }),
    );
    const rows = calcGroupDailyRows(data.Items || []);
    exportRowsToCsv(rows, buildExportColumns(), '代理分组日报');
  } finally {
    exportLoading.value = false;
  }
}

watch(reportType, (value) => {
  initDateRange(value);
});

onMounted(async () => {
  initDateRange();
  await loadGroupOptions();
  await loadData();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="ops-query-scope mb-1">
    <div class="ops-query-filters">
              
          <Space.Compact>
          <span class="query-field-addon">选择分类</span>
          <Cascader
            v-model:value="groupTemp"
            :field-names="{
              children: 'List',
              label: 'GroupName',
              value: 'Id',
            }"
            :options="groupOptions"
            allow-clear
            change-on-select
            max-tag-count="responsive"
            multiple
            placeholder="请选择分组" 
            @change="handleGroupChange"
          />
        </Space.Compact>

        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="reportType"
          :options="[
            { label: '日报', value: 1 },
            { label: '月报', value: 2 },
          ]"
        />

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
        

        <Space.Compact>
            <span class="query-field-addon">数据类型</span>
            <Select
              v-model:value="dataSearchType"
              :options="memberTypeOptions"
              placeholder="请选择数据类型"
            />
          </Space.Compact>
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

    <Card size="small" title="代理分组日报">
      <Spin :spinning="loading">
        <GroupDailyTable
          :list="tableData"
          :report-type="reportType"
          :show-agent-count="showAgentCount"
          @drill="handleDrill"
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
      </Spin>
    </Card>
  </div>
</template>
