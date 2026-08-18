<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  message,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

import { fetchDayStatementSonListApi } from '#/api/dataClose/day-statement';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import {
  arrayToCsvParam,
  resolveReportRange,
  toUnixRange,
} from '#/views/dataClose/shared/report-utils';
import StatementAgentTree from '#/views/dataClose/shared/statement-agent-tree.vue';
import {
  type AgentNode,
  asNumber,
  displayAmount,
  displayCent,
  ensureDaySpan,
  fromCent,
  mapItemsAgents,
  profitClass,
  resolveTotalSum,
  type StatementRow,
  venueName,
} from '#/views/dataClose/shared/statement-helpers';

import SonDetailModal from './son-detail-modal.vue';

defineOptions({ name: 'DayStatementSonPanel' });

const { checkPermission, projectConfig } = useCloudPermission();
const {
  dataSearchTypeOptions,
  ensureGameConfig,
  iosAppStoreOptions,
  platformGameTypeMap,
  platformGameTypeOptions,
} = useReportOptions();

const loading = ref(false);
const tableData = ref<StatementRow[]>([]);
const totalSum = ref<StatementRow>({});
const sumPositiveProfit = ref(0);
const adminPath = ref<AgentNode[]>([]);
const agencyList = ref<AgentNode[]>([]);
const inquireId = ref<number | string>(
  projectConfig.value?.AgentAccount?.Id ?? '',
);
const adminId = ref<number | string>('');
const appUrls = ref<string[]>([]);
const dataSearchType = ref<number>(0);
const platformGameTypes = ref<Array<number | string>>([]);
/** 对齐旧站 getBeforeDateStr(1)：今天全日 */
const dateRange = ref<[Dayjs, Dayjs]>(resolveReportRange('today'));
const detailOpen = ref(false);
const detailRow = ref<null | StatementRow>(null);

const canList = computed(() => checkPermission(10_501));
const canExport = computed(() => checkPermission(10_503));
const canDetail = computed(() => checkPermission(10_504));

const rootAccount = computed<AgentNode>(() => ({
  Id: projectConfig.value?.AgentAccount?.Id ?? '',
  Username: projectConfig.value?.AgentAccount?.Username || '当前账号',
}));

const summaryItems = computed(() => [
  {
    title: '投注总计',
    value: displayCent(
      asNumber(totalSum.value.SumSelfBetGold) +
        asNumber(totalSum.value.SumNotSelfBetGold),
    ),
  },
  {
    title: '派送总计',
    value: displayCent(
      asNumber(totalSum.value.SumSelfWinGold) +
        asNumber(totalSum.value.SumNotSelfWinGold),
    ),
  },
  {
    title: '正盈利总计',
    value: displayAmount(sumPositiveProfit.value),
  },
]);

const columns = computed(() => {
  const cols = [
    {
      align: 'center' as const,
      dataIndex: 'ReportDay',
      key: 'ReportDay',
      title: '时间',
    },
    {
      align: 'center' as const,
      dataIndex: 'AgentName',
      key: 'AgentName',
      title: '子代理名称',
    },
    {
      align: 'center' as const,
      dataIndex: 'PlatforName',
      key: 'PlatforName',
      title: '产品名称',
    },
    {
      align: 'center' as const,
      dataIndex: 'SelfCountNum',
      key: 'SelfCountNum',
      title: '投注人数',
    },
    { align: 'center' as const, key: 'SelfBetGold', title: '投注金币' },
    { align: 'center' as const, key: 'SelfWinGold', title: '派送金币' },
    { align: 'center' as const, key: 'ProfitLoss', title: '盈亏' },
    { align: 'center' as const, key: 'PositiveProfit', title: '正盈亏' },
    { align: 'center' as const, key: 'NegativeProfit', title: '负盈亏' },
  ];
  if (canDetail.value) {
    cols.push({
      align: 'center' as const,
      key: 'actions',
      title: '操作',
    } as (typeof cols)[number]);
  }
  return cols;
});

function buildQuery() {
  const { BeginTime, EndTime } = toUnixRange(dateRange.value);
  return {
    AdminId: adminId.value || '',
    AppUrl: arrayToCsvParam(appUrls.value) || '',
    BeginTime,
    DataSearchType: dataSearchType.value,
    EndTime,
    PlatformGameType: arrayToCsvParam(platformGameTypes.value) || '',
  };
}

async function loadList() {
  if (!canList.value) return;
  if (!ensureDaySpan(dateRange.value, 7)) return;
  loading.value = true;
  sumPositiveProfit.value = 0;
  agencyList.value = [];
  try {
    await ensureGameConfig();
    const result = await fetchDayStatementSonListApi(buildQuery());
    if (adminPath.value.length === 0) {
      adminPath.value = [rootAccount.value];
    }
    agencyList.value = mapItemsAgents(result.ItemsAgents);
    const items = Array.isArray(result.Items) ? result.Items : [];
    let positive = 0;
    tableData.value = items
      .filter((row) => platformGameTypeMap.value[String(row.PlatformGameType)])
      .map((row, index) => {
        const SelfBetGold = fromCent(row.SelfBetGold);
        const SelfWinGold = fromCent(row.SelfWinGold);
        const SelfOtherGold = fromCent(row.SelfOtherGold);
        const PositiveProfit = fromCent(row.PositiveProfit);
        const NegativeProfit = fromCent(row.NegativeProfit);
        positive += PositiveProfit;
        return {
          ...row,
          NegativeProfit,
          PlatforName: venueName(
            platformGameTypeMap.value,
            row.PlatformGameType,
          ),
          PositiveProfit,
          ProfitLoss: Number((SelfBetGold - SelfWinGold).toFixed(2)),
          SelfBetGold,
          SelfOtherGold,
          SelfWinGold,
          _rowKey: `${row.ReportDay}-${row.AgentId}-${row.PlatformGameType}-${index}`,
        };
      });
    sumPositiveProfit.value = positive;
    totalSum.value = resolveTotalSum(result.MoreItems);
  } catch {
    tableData.value = [];
    totalSum.value = {};
    sumPositiveProfit.value = 0;
    agencyList.value = [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  adminId.value = '';
  appUrls.value = [];
  dataSearchType.value = 0;
  platformGameTypes.value = [];
  dateRange.value = resolveReportRange('today');
  adminPath.value = [];
  agencyList.value = [];
  inquireId.value = rootAccount.value.Id;
  void loadList();
}

function onDrill(agent: AgentNode) {
  adminPath.value = [...adminPath.value, agent];
  adminId.value = agent.Id;
  inquireId.value = agent.Id;
  void loadList();
}

function onJump(agent: AgentNode, index: number) {
  adminPath.value = adminPath.value.slice(0, index + 1);
  adminId.value = String(agent.Id) === String(rootAccount.value.Id) ? '' : agent.Id;
  inquireId.value = agent.Id;
  void loadList();
}

function openDetail(row: StatementRow) {
  detailRow.value = row;
  detailOpen.value = true;
}

async function handleExport() {
  if (tableData.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const total = totalSum.value;
  const rows: StatementRow[] = [
    ...tableData.value,
    {
      AgentName: '-',
      NegativeProfit: displayCent(total.SumNegative),
      PlatforName: '-',
      PositiveProfit: displayCent(total.SumPositive),
      ProfitLoss: displayCent(
        asNumber(total.SumSelfBetGold) -
          asNumber(total.SumSelfWinGold) +
          asNumber(total.SumSelfOtherGold),
      ),
      ReportDay: '总计:',
      SelfBetGold: displayCent(total.SumSelfBetGold),
      SelfCountNum: total.SumCountBetNum ?? '-',
      SelfOtherGold: displayCent(total.SumSelfOtherGold),
      SelfWinGold: displayCent(total.SumSelfWinGold),
      _isTotal: true,
    },
  ];
  await exportReportXlsx(
    rows,
    [
      '时间',
      '子代理名称',
      '产品名称',
      '投注人数',
      '投注金币',
      '派送金币',
      '其他金币消耗',
      '盈亏',
      '正盈亏',
      '负盈亏',
    ],
    '子包网报表',
    (row) => [
      row.ReportDay,
      row.AgentName,
      row.PlatforName,
      row.SelfCountNum,
      row._isTotal ? row.SelfBetGold : displayAmount(row.SelfBetGold),
      row._isTotal ? row.SelfWinGold : displayAmount(row.SelfWinGold),
      row._isTotal ? row.SelfOtherGold : displayAmount(row.SelfOtherGold),
      row._isTotal ? row.ProfitLoss : displayAmount(row.ProfitLoss),
      row._isTotal ? row.PositiveProfit : displayAmount(row.PositiveProfit),
      row._isTotal ? row.NegativeProfit : displayAmount(row.NegativeProfit),
    ],
  );
  void fetchDayStatementSonListApi({ ...buildQuery(), IsExp: true }).catch(
    () => undefined,
  );
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <StatementAgentTree
      :agents="agencyList"
      :path="adminPath"
      @drill="onDrill"
      @jump="onJump"
    />
    <ReportSummaryCards :items="summaryItems" />
    <ReportQueryCard>
      <Space.Compact>
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="dataSearchType"
          class="w-36"
          :options="dataSearchTypeOptions"
          placeholder="请选择数据类型"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="appUrls"
          allow-clear
          class="w-48"
          mode="multiple"
          :max-tag-count="1"
          :options="iosAppStoreOptions"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">产品名称</span>
        <Select
          v-model:value="platformGameTypes"
          allow-clear
          class="w-48"
          mode="multiple"
          :max-tag-count="1"
          :options="platformGameTypeOptions"
          placeholder="请选择产品名称"
        />
      </Space.Compact>
      <QueryDatetimeRangePicker v-model="dateRange" precision="date" />
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button :disabled="loading" @click="reset">重置</Button>
        <Button v-if="canExport" :disabled="loading" @click="handleExport">
          导出 Excel
        </Button>
      </template>
      <template #extra>
        <div class="text-xs text-muted-foreground">
          默认今天，最长 7 天
        </div>
      </template>
    </ReportQueryCard>

    <Table
      v-if="canList"
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="_rowKey"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'SelfBetGold'">
          {{ displayAmount(record.SelfBetGold) }}
        </template>
        <template v-else-if="column.key === 'SelfWinGold'">
          {{ displayAmount(record.SelfWinGold) }}
        </template>
        <template v-else-if="column.key === 'ProfitLoss'">
          <span :class="profitClass(record.ProfitLoss)">
            {{ displayAmount(record.ProfitLoss) }}
          </span>
        </template>
        <template v-else-if="column.key === 'PositiveProfit'">
          {{ displayAmount(record.PositiveProfit) }}
        </template>
        <template v-else-if="column.key === 'NegativeProfit'">
          {{ displayAmount(record.NegativeProfit) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button type="link" size="small" @click="openDetail(record)">
            详情
          </Button>
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">总计:</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="2">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ totalSum.SumCountBetNum ?? 0 }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ displayCent(totalSum.SumSelfBetGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ displayCent(totalSum.SumSelfWinGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{
                displayCent(
                  asNumber(totalSum.SumSelfBetGold) -
                    asNumber(totalSum.SumSelfWinGold) +
                    asNumber(totalSum.SumSelfOtherGold),
                )
              }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ displayCent(totalSum.SumPositive) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">
              {{ displayCent(totalSum.SumNegative) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell v-if="canDetail" :index="9">-</Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
    <div v-else class="py-8 text-center text-muted-foreground">无列表权限</div>

    <SonDetailModal
      v-model:open="detailOpen"
      :inquire-id="inquireId"
      :row="detailRow"
    />
  </div>
</template>
