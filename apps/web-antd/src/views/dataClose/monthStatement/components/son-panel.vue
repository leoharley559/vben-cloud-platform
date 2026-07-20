<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  Popover,
  Select,
  Table,
  Tooltip,
} from 'ant-design-vue';

import { fetchMonthStatementSonListApi } from '#/api/dataClose/month-statement';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import {
  arrayToCsvParam,
  toMonthRange,
} from '#/views/dataClose/shared/report-utils';
import StatementAgentTree from '#/views/dataClose/shared/statement-agent-tree.vue';
import {
  type AgentNode,
  asNumber,
  defaultMonthRange,
  displayAmount,
  displayCent,
  ensureMonthSpan,
  formatCrossLabel,
  fromCent,
  mapItemsAgents,
  parseServiceRate,
  profitClass,
  resolveTotalSum,
  type StatementRow,
  venueName,
} from '#/views/dataClose/shared/statement-helpers';

import SonDetailModal from './son-detail-modal.vue';

defineOptions({ name: 'MonthStatementSonPanel' });

const { checkPermission, projectConfig } = useCloudPermission();
const { ensureGameConfig, iosAppStoreOptions, packageOptions, platformGameTypeMap, platformGameTypeOptions } =
  useReportOptions();

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
const packageId = ref<number | string | undefined>();
const appUrls = ref<string[]>([]);
const platformGameTypes = ref<Array<number | string>>([]);
const monthRange = ref<[Dayjs, Dayjs]>(defaultMonthRange());
const detailOpen = ref(false);
const detailRow = ref<null | StatementRow>(null);

const canList = computed(() => checkPermission(10_512));
const canExport = computed(() => checkPermission(10_513));
const canDetail = computed(() => checkPermission(10_514));

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
  {
    title: '抽成总计',
    value: displayCent(totalSum.value.SumMustGetTaxMoney),
  },
]);

const columns = computed(() => {
  const cols = [
    {
      align: 'center' as const,
      dataIndex: 'ReportMonth',
      key: 'ReportMonth',
      title: '时间',
    },
    {
      align: 'center' as const,
      dataIndex: 'AgentName',
      key: 'AgentName',
      title: '子包网名称',
    },
    {
      align: 'center' as const,
      dataIndex: 'PlatforName',
      key: 'PlatforName',
      title: '场馆名称',
    },
    { align: 'center' as const, key: 'SumSelfBetGold', title: '投注金币' },
    { align: 'center' as const, key: 'SumSelfWinGold', title: '派送金币' },
    { align: 'center' as const, key: 'ProfitLoss', title: '盈亏' },
    { align: 'center' as const, key: 'PositiveProfit', title: '正盈亏' },
    { align: 'center' as const, key: 'NegativeProfit', title: '负盈亏' },
    { align: 'center' as const, key: 'ServiceRateDynamic', title: '抽成比例' },
    { align: 'center' as const, key: 'MustGetTaxMoney', title: '应抽成金额' },
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
  const { BeginTime, EndTime } = toMonthRange(monthRange.value);
  return {
    AdminId: adminId.value || '',
    AppUrl: arrayToCsvParam(appUrls.value) || '',
    BeginTime,
    EndTime,
    PackageId: packageId.value ?? '',
    PlatformGameType: arrayToCsvParam(platformGameTypes.value) || '',
  };
}

async function loadList() {
  if (!canList.value) return;
  if (!ensureMonthSpan(monthRange.value, 62)) return;
  loading.value = true;
  sumPositiveProfit.value = 0;
  agencyList.value = [];
  try {
    await ensureGameConfig();
    const result = await fetchMonthStatementSonListApi(buildQuery());
    if (adminPath.value.length === 0) {
      adminPath.value = [rootAccount.value];
    }
    agencyList.value = mapItemsAgents(result.ItemsAgents);
    const items = Array.isArray(result.Items) ? result.Items : [];
    let positive = 0;
    tableData.value = items
      .filter((row) => platformGameTypeMap.value[String(row.PlatformGameType)])
      .map((row, index) => {
        const SumSelfBetGold = fromCent(row.SumSelfBetGold);
        const SumSelfWinGold = fromCent(row.SumSelfWinGold);
        const SumSelfOtherGold = fromCent(row.SumSelfOtherGold);
        const PositiveProfit = fromCent(row.PositiveProfit);
        const NegativeProfit = fromCent(row.NegativeProfit);
        const MustGetTaxMoney = fromCent(row.MustGetTaxMoney);
        positive += PositiveProfit;
        return {
          ...row,
          MustGetTaxMoney,
          NegativeProfit,
          PlatforName: venueName(
            platformGameTypeMap.value,
            row.PlatformGameType,
          ),
          PositiveProfit,
          ProfitLoss: SumSelfBetGold - SumSelfWinGold,
          SumSelfBetGold,
          SumSelfOtherGold,
          SumSelfWinGold,
          _rowKey: `${row.ReportMonth}-${row.AgentId}-${row.PlatformGameType}-${index}`,
        };
      });
    sumPositiveProfit.value = positive;
    totalSum.value = resolveTotalSum(result.MoreItems);
  } finally {
    loading.value = false;
  }
}

function reset() {
  adminId.value = '';
  packageId.value = undefined;
  appUrls.value = [];
  platformGameTypes.value = [];
  monthRange.value = defaultMonthRange();
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
      MustGetTaxMoney: displayCent(total.SumMustGetTaxMoney),
      NegativeProfit: displayCent(total.SumNegative),
      PlatforName: '-',
      PositiveProfit: displayCent(total.SumPositive),
      ProfitLoss: displayCent(
        asNumber(total.SumSelfBetGold) -
          asNumber(total.SumSelfWinGold) +
          asNumber(total.SumSelfOtherGold),
      ),
      ReportMonth: '总计:',
      ServiceRateDynamic: '-',
      SumSelfBetGold: displayCent(total.SumSelfBetGold),
      SumSelfWinGold: displayCent(total.SumSelfWinGold),
      _isTotal: true,
    },
  ];
  await exportReportXlsx(
    rows,
    [
      '时间',
      '子包网名称',
      '场馆名称',
      '投注金币',
      '派送金币',
      '盈亏',
      '正盈亏',
      '负盈亏',
      '抽成比例',
      '应抽成金额',
    ],
    '子包网报表',
    (row) => [
      row.ReportMonth,
      row.AgentName,
      row.PlatforName,
      row._isTotal ? row.SumSelfBetGold : displayAmount(row.SumSelfBetGold),
      row._isTotal ? row.SumSelfWinGold : displayAmount(row.SumSelfWinGold),
      row._isTotal ? row.ProfitLoss : displayAmount(row.ProfitLoss),
      row._isTotal ? row.PositiveProfit : displayAmount(row.PositiveProfit),
      row._isTotal ? row.NegativeProfit : displayAmount(row.NegativeProfit),
      row.ServiceRateDynamic ?? '-',
      row._isTotal ? row.MustGetTaxMoney : displayAmount(row.MustGetTaxMoney),
    ],
  );
  void fetchMonthStatementSonListApi({ ...buildQuery(), IsExp: true }).catch(
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
      <Select
        v-model:value="packageId"
        allow-clear
        class="w-44"
        :options="packageOptions"
        placeholder="产品"
      />
      <Select
        v-model:value="appUrls"
        allow-clear
        class="w-48"
        mode="multiple"
        :max-tag-count="1"
        :options="iosAppStoreOptions"
        placeholder="上架包"
      />
      <Select
        v-model:value="platformGameTypes"
        allow-clear
        class="w-48"
        mode="multiple"
        :max-tag-count="1"
        :options="platformGameTypeOptions"
        placeholder="场馆"
      />
      <DatePicker.RangePicker v-model:value="monthRange" picker="month" />
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button :disabled="loading" @click="reset">重置</Button>
        <Button v-if="canExport" :disabled="loading" @click="handleExport">
          导出 Excel
        </Button>
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
      <template #headerCell="{ column }">
        <template v-if="column.key === 'MustGetTaxMoney'">
          <Tooltip title="应抽成金额">
            <span>应抽成金额</span>
          </Tooltip>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'SumSelfBetGold'">
          {{ displayAmount(record.SumSelfBetGold) }}
        </template>
        <template v-else-if="column.key === 'SumSelfWinGold'">
          {{ displayAmount(record.SumSelfWinGold) }}
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
        <template v-else-if="column.key === 'ServiceRateDynamic'">
          <Popover title="利润阶梯" trigger="hover">
            <template #content>
              <ul class="m-0 list-none space-y-1 p-0 text-sm">
                <li
                  v-for="item in parseServiceRate(record.ServiceRateDynamic)"
                  :key="`${item[0]}-${item[1]}`"
                >
                  盈利&lt;={{ formatCrossLabel(item[0]) }} 费率{{ item[1] }}%
                </li>
              </ul>
            </template>
            <Button type="link" size="small">抽成比例</Button>
          </Popover>
        </template>
        <template v-else-if="column.key === 'MustGetTaxMoney'">
          {{ displayAmount(record.MustGetTaxMoney) }}
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
              {{ displayCent(totalSum.SumSelfBetGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ displayCent(totalSum.SumSelfWinGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{
                displayCent(
                  asNumber(totalSum.SumSelfBetGold) -
                    asNumber(totalSum.SumSelfWinGold) +
                    asNumber(totalSum.SumSelfOtherGold),
                )
              }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ displayCent(totalSum.SumPositive) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ displayCent(totalSum.SumNegative) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="9">
              {{ displayCent(totalSum.SumMustGetTaxMoney) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell v-if="canDetail" :index="10">-</Table.Summary.Cell>
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
