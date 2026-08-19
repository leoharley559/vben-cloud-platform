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

import { fetchDayStatementTotalListApi } from '#/api/dataClose/day-statement';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
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
import {
  displayAmount,
  displayCent,
  ensureDaySpan,
  footerProfitFromTotal,
  joinParam,
  mapDayMoneyRow,
  profitClass,
  resolveTotalSum,
  type StatementRow,
} from '#/views/dataClose/shared/statement-helpers';

defineOptions({ name: 'DayStatementTotalPanel' });

const { checkPermission } = useCloudPermission();
const {
  ensureGameConfig,
  gameConfig,
  iosAppStoreOptions,
  platformGameTypeOptions,
} = useReportOptions();

const loading = ref(false);
const tableData = ref<StatementRow[]>([]);
const totalSum = ref<StatementRow>({});
const adminIds = ref<Array<number | string>>([]);
const channelIds = ref<Array<number | string>>([]);
const appUrls = ref<string[]>([]);
const venueTypes = ref<Array<number | string>>([]);
/** 对齐旧站 getBeforeDateStr(2)：昨天全日 */
const dateRange = ref<[Dayjs, Dayjs]>(resolveReportRange('yesterday'));

const canList = computed(() => checkPermission(10_497));
const canExport = computed(() => checkPermission(10_498));

const summaryItems = computed(() => [
  { title: '投注总计', value: displayCent(totalSum.value.SumSelfBetGold) },
  { title: '派送总计', value: displayCent(totalSum.value.SumSelfWinGold) },
  { title: '正盈利总计', value: displayCent(totalSum.value.SumPositive) },
]);

const columns = [
  { align: 'center' as const, dataIndex: 'ReportDay', key: 'ReportDay', title: '时间' },
  { align: 'center' as const, dataIndex: 'AgentName', key: 'AgentName', title: '场馆名称' },
  {
    align: 'center' as const,
    dataIndex: 'SelfCountNum',
    key: 'SelfCountNum',
    title: '投注人数',
  },
  { align: 'center' as const, key: 'SelfBetGold', title: '投注金币' },
  { align: 'center' as const, key: 'SelfWinGold', title: '派送金币' },
  { align: 'center' as const, key: 'ProfitLose', title: '盈亏' },
  { align: 'center' as const, key: 'Positive', title: '正盈利' },
  { align: 'center' as const, key: 'Negative', title: '负盈利' },
];

function buildQuery() {
  const { BeginTime, EndTime } = toUnixRange(dateRange.value);
  return {
    AdminId: joinParam(adminIds.value),
    AppUrl: arrayToCsvParam(appUrls.value) || '',
    BeginTime,
    ChannelId: joinParam(channelIds.value),
    EndTime,
    PlatformGameType: joinParam(venueTypes.value),
  };
}

async function loadList() {
  if (!canList.value) return;
  if (!ensureDaySpan(dateRange.value, 30)) return;
  loading.value = true;
  try {
    await ensureGameConfig();
    const result = await fetchDayStatementTotalListApi(buildQuery());
    const items = Array.isArray(result.Items) ? result.Items : [];
    tableData.value = items.map((row, index) => ({
      ...mapDayMoneyRow(row, gameConfig.value, {
        includePositive: true,
      }),
      _rowKey: `${row.ReportDay}-${row.PlatformGameType}-${index}`,
    }));
    totalSum.value = resolveTotalSum(result.MoreItems);
  } catch {
    tableData.value = [];
    totalSum.value = {};
  } finally {
    loading.value = false;
  }
}

function reset() {
  adminIds.value = [];
  channelIds.value = [];
  appUrls.value = [];
  venueTypes.value = [];
  dateRange.value = resolveReportRange('yesterday');
  void loadList();
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
      Negative: displayCent(total.SumNegative),
      Positive: displayCent(total.SumPositive),
      ProfitLose: displayCent(footerProfitFromTotal(total)),
      ReportDay: '总计:',
      SelfBetGold: displayCent(total.SumSelfBetGold),
      SelfCountNum: total.SumSelfCountNum ?? '-',
      SelfWinGold: displayCent(total.SumSelfWinGold),
      _isTotal: true,
    },
  ];
  await exportReportXlsx(
    rows,
    [
      '时间',
      '场馆名称',
      '投注人数',
      '投注金币',
      '派送金币',
      '盈亏',
      '正盈利',
      '负盈利',
    ],
    '汇总报表',
    (row) => [
      row.ReportDay,
      row.AgentName,
      row.SelfCountNum,
      row._isTotal ? row.SelfBetGold : displayAmount(row.SelfBetGold),
      row._isTotal ? row.SelfWinGold : displayAmount(row.SelfWinGold),
      row._isTotal ? row.ProfitLose : displayAmount(row.ProfitLose),
      row._isTotal ? row.Positive : displayAmount(row.Positive),
      row._isTotal ? row.Negative : displayAmount(row.Negative),
    ],
  );
  void fetchDayStatementTotalListApi({ ...buildQuery(), IsExp: true }).catch(
    () => undefined,
  );
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <ReportQueryCard>
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="adminIds" class="w-56" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="channelIds" class="w-56" placeholder="请输入渠道号" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="appUrls"
          allow-clear
          class="w-48"
          mode="multiple"
          :options="iosAppStoreOptions"
          :max-tag-count="1"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">场馆</span>
        <Select
          v-model:value="venueTypes"
          allow-clear
          class="w-48"
          mode="multiple"
          :options="platformGameTypeOptions"
          :max-tag-count="1"
          placeholder="请选择场馆"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" label="时间范围" precision="date" />
        </div>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button :disabled="loading" @click="reset">重置</Button>
        <Button v-if="canExport" :disabled="loading" @click="handleExport">
          导出 Excel
        </Button>
      </template>
      <template #extra>
        <div class="text-xs text-muted-foreground">
          默认昨天，最长 30 天
        </div>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

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
        <template v-else-if="column.key === 'ProfitLose'">
          <span :class="profitClass(record.ProfitLose)">
            {{ displayAmount(record.ProfitLose) }}
          </span>
        </template>
        <template v-else-if="column.key === 'Positive'">
          {{ displayAmount(record.Positive) }}
        </template>
        <template v-else-if="column.key === 'Negative'">
          {{ displayAmount(record.Negative) }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">总计:</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ totalSum.SumSelfCountNum ?? 0 }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ displayCent(totalSum.SumSelfBetGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ displayCent(totalSum.SumSelfWinGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              <span :class="profitClass(footerProfitFromTotal(totalSum))">
                {{ displayCent(footerProfitFromTotal(totalSum)) }}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ displayCent(totalSum.SumPositive) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ displayCent(totalSum.SumNegative) }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
    <div v-else class="py-8 text-center text-muted-foreground">无列表权限</div>
  </div>
</template>
