<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { TeamDailyHistoryItem, TeamDailySummary } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  message,
  Result,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTeamDailyListApi } from '#/api/promotion/team-daily';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatTeamQueryMoney } from '#/utils/promotion';

const props = defineProps<{
  teamType: 1 | 2;
}>();

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canViewToday = computed(() =>
  props.teamType === 1 ? checkPermission(10_872) : checkPermission(10_874),
);
const canViewHistory = computed(() =>
  props.teamType === 1 ? checkPermission(10_873) : checkPermission(10_875),
);
const isProfitMode = computed(() => props.teamType === 2);

/** 默认当月：月初 ～ 今天 */
function currentMonthRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('day')];
}

const loading = ref(false);
const filterAdminId = ref<number | string | undefined>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(currentMonthRange());
const todayData = ref<TeamDailySummary>({});
const historySummary = ref<TeamDailySummary>({});
const rows = ref<TeamDailyHistoryItem[]>([]);
let requestId = 0;

const teamAccountOptions = computed(() => {
  const source = (projectConfig.value?.ChildAccountTeam || []) as Array<{
    Id?: number | string;
    TeamType?: number;
    Username?: string;
  }>;
  // 利润模式对齐旧站 team-zong：仅 TeamType===2；提现模式展示全部子团队账号
  return source
    .filter((item) => (isProfitMode.value ? Number(item.TeamType) === 2 : true))
    .map((item) => ({
      label: item.Username || String(item.Id),
      value: item.Id,
    }))
    .filter((item) => item.value !== undefined && item.value !== null);
});

function money(value?: number) {
  return formatTeamQueryMoney(value);
}

function income(
  data: TeamDailyHistoryItem | TeamDailySummary,
  scope: 'next' | 'self',
  historical = 'ReportDay' in data,
) {
  const prefix = historical ? 'Sum' : '';
  const field = isProfitMode.value
    ? `${prefix}${scope === 'self' ? 'Self' : 'Next'}ProfitIncomeMoney`
    : `${prefix}${scope === 'self' ? 'Self' : 'Next'}IncomeMoney`;
  return Number((data as unknown as Record<string, unknown>)[field] || 0);
}

function buildDailyMetrics(
  data: TeamDailySummary,
  historical = false,
): Array<{
  label: string;
  money: boolean;
  value?: number;
}> {
  const prefix = historical ? 'Sum' : '';
  const metric = isProfitMode.value ? 'WithdrawMoney' : 'BetGameMoney';
  const metricLabel = isProfitMode.value ? '提现' : '流水';
  const value = (field: string) =>
    (data as unknown as Record<string, number | undefined>)[
      `${prefix}${field}`
    ];
  return [
    { label: '自营注册', money: false, value: value('SelfReg') || 0 },
    { label: '自营充值', money: true, value: value('SelfPayMergerMoney') },
    { label: `自营${metricLabel}`, money: true, value: value(`Self${metric}`) },
    { label: '自营税收', money: true, value: value('SelfGameTax') },
    {
      label: isProfitMode.value ? '自营利润收入' : '自营收入',
      money: true,
      value: income(data, 'self', historical),
    },
    { label: '下级注册', money: false, value: value('NextReg') || 0 },
    { label: '下级充值', money: true, value: value('NextPayMergerMoney') },
    { label: `下级${metricLabel}`, money: true, value: value(`Next${metric}`) },
    { label: '下级税收', money: true, value: value('NextGameTax') },
    {
      label: isProfitMode.value ? '下级利润收入' : '下级收入',
      money: true,
      value: income(data, 'next', historical),
    },
  ];
}

const todaySummaryItems = computed(() =>
  buildDailyMetrics(todayData.value).map((item) => ({
    label: item.label,
    value: item.money ? money(Number(item.value || 0)) : (item.value ?? 0),
  })),
);
const historySummaryItems = computed(() =>
  buildDailyMetrics(historySummary.value, true).map((item) => ({
    label: item.label,
    value: item.money ? money(Number(item.value || 0)) : (item.value ?? 0),
  })),
);

function createEmptyHistoryRow(reportDay: string): TeamDailyHistoryItem {
  return {
    ReportDay: reportDay,
    SumNextBetGameMoney: 0,
    SumNextGameTax: 0,
    SumNextIncomeMoney: 0,
    SumNextPayMergerMoney: 0,
    SumNextProfitIncomeMoney: 0,
    SumNextReg: 0,
    SumNextWithdrawMoney: 0,
    SumSelfBetGameMoney: 0,
    SumSelfGameTax: 0,
    SumSelfIncomeMoney: 0,
    SumSelfPayMergerMoney: 0,
    SumSelfProfitIncomeMoney: 0,
    SumSelfReg: 0,
    SumSelfWithdrawMoney: 0,
  };
}

/** 按查询区间补齐每一天；接口无数据时仍展示默认 0 行 */
function fillHistoryByDateRange(
  items: TeamDailyHistoryItem[],
  begin: dayjs.Dayjs,
  end: dayjs.Dayjs,
) {
  const byDay = new Map(
    items
      .filter((item) => item.ReportDay)
      .map((item) => [String(item.ReportDay).slice(0, 10), item]),
  );
  const filled: TeamDailyHistoryItem[] = [];
  let cursor = end.startOf('day');
  const start = begin.startOf('day');
  while (cursor.isAfter(start) || cursor.isSame(start, 'day')) {
    const key = cursor.format('YYYY-MM-DD');
    filled.push(byDay.get(key) || createEmptyHistoryRow(key));
    cursor = cursor.subtract(1, 'day');
  }
  return filled;
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    // 空选对齐旧站传 ''
    AdminId: filterAdminId.value ?? '',
    BeginTime: begin?.startOf('day').unix() || defaultBegin.unix(),
    EndTime: end?.endOf('day').unix() || defaultEnd.unix(),
    Page: 1,
    // 覆盖近 31 日明细；旧站用全局 pageSize 可能导致历史日被截断
    PageSize: 200,
    Sort: '',
    TeamType: props.teamType,
  };
}

async function loadData() {
  const [begin, end] = filterDateRange.value || [];
  if (!begin || !end) {
    message.warning('请选择日期范围');
    return;
  }
  if (end.diff(begin, 'day') > 30) {
    message.warning('历史数据最多查询 31 个自然日');
    return;
  }
  const currentRequest = ++requestId;
  loading.value = true;
  try {
    const result = await fetchTeamDailyListApi(getQueryParams());
    if (currentRequest !== requestId) return;
    todayData.value = result.TodayItems || {};
    historySummary.value = result.BannerItems || {};
    rows.value = fillHistoryByDateRange(
      Array.isArray(result.HistoryItems) ? result.HistoryItems : [],
      begin,
      end,
    );
  } catch {
    if (currentRequest === requestId) {
      todayData.value = {};
      historySummary.value = {};
      rows.value = fillHistoryByDateRange([], begin, end);
    }
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function reset() {
  filterAdminId.value = '';
  filterDateRange.value = currentMonthRange();
  loadData();
}

const columns = computed<TableColumnsType<TeamDailyHistoryItem>>(() => {
  const selfChildren: TableColumnsType<TeamDailyHistoryItem> = [
    {
      dataIndex: 'SumSelfReg',
      key: 'SumSelfReg',
      title: '注册人数',
      width: 90,
    },
    {
      dataIndex: 'SumSelfPayMergerMoney',
      key: 'SumSelfPayMergerMoney',
      title: '充值金额',
      width: 110,
    },
    ...(isProfitMode.value
      ? [
          {
            dataIndex: 'SumSelfWithdrawMoney',
            key: 'SumSelfWithdrawMoney',
            title: '提现金额',
            width: 110,
          },
        ]
      : []),
    {
      dataIndex: 'SumSelfBetGameMoney',
      key: 'SumSelfBetGameMoney',
      title: '流水金额',
      width: 110,
    },
    {
      dataIndex: 'SumSelfGameTax',
      key: 'SumSelfGameTax',
      title: '税收',
      width: 100,
    },
    { key: 'selfIncome', title: '收入', width: 110 },
  ];
  const nextChildren: TableColumnsType<TeamDailyHistoryItem> = [
    {
      dataIndex: 'SumNextReg',
      key: 'SumNextReg',
      title: '注册人数',
      width: 90,
    },
    {
      dataIndex: 'SumNextPayMergerMoney',
      key: 'SumNextPayMergerMoney',
      title: '充值金额',
      width: 110,
    },
    ...(isProfitMode.value
      ? [
          {
            dataIndex: 'SumNextWithdrawMoney',
            key: 'SumNextWithdrawMoney',
            title: '提现金额',
            width: 110,
          },
        ]
      : []),
    {
      dataIndex: 'SumNextBetGameMoney',
      key: 'SumNextBetGameMoney',
      title: '流水金额',
      width: 110,
    },
    {
      dataIndex: 'SumNextGameTax',
      key: 'SumNextGameTax',
      title: '税收',
      width: 100,
    },
    { key: 'nextIncome', title: '贡献收入', width: 120 },
  ];
  return [
    {
      dataIndex: 'ReportDay',
      fixed: 'left',
      key: 'ReportDay',
      title: '日期',
      width: 120,
    },
    { children: selfChildren, key: 'self', title: '自营数据' },
    { children: nextChildren, key: 'next', title: '下级数据' },
    {
      fixed: 'right',
      key: 'totalIncome',
      title: isProfitMode.value ? '总利润收入' : '总收入',
      width: 120,
    },
  ];
});

function cellValue(row: TeamDailyHistoryItem, key: string) {
  if (key === 'selfIncome') return money(income(row, 'self'));
  if (key === 'nextIncome') return money(income(row, 'next'));
  if (key === 'totalIncome') {
    return money(income(row, 'self') + income(row, 'next'));
  }
  const raw = (row as unknown as Record<string, unknown>)[key];
  return key.includes('Reg') || key === 'ReportDay'
    ? (raw ?? '-')
    : money(Number(raw || 0));
}

function headerHelp(key: string) {
  const helps: Record<string, string> = {
    SumNextGameTax:
      '单人游戏税收=流水金额 × 1.5%；多人游戏税收=流水金额 × 2.5%',
    SumSelfGameTax:
      '单人游戏税收=流水金额 × 1.5%；多人游戏税收=流水金额 × 2.5%',
    nextIncome: isProfitMode.value
      ? '下级贡献收入=充值金额-提现金额-税收×a%'
      : '下级贡献收入=下级税收 ×（我的分成比例 - 下级分成比例）',
    selfIncome: isProfitMode.value
      ? '收入=充值金额-提现金额-税收×a%'
      : '收入=税收 × 分成比例',
    totalIncome: '总收入=自营收入+下级贡献收入',
  };
  return helps[key];
}

onMounted(() => {
  if (canViewToday.value || canViewHistory.value) loadData();
});
</script>

<template>
  <Spin :spinning="loading">
    <div v-if="canViewToday || canViewHistory">
      <section v-if="canViewToday" class="daily-section">
        <div class="section-title">今日数据</div>
        <SummaryCards :items="todaySummaryItems" />
      </section>

      <section v-if="canViewHistory" class="daily-section">
        <div class="history-header">
          <div>
            <div class="section-title">历史数据</div>
            <div class="history-hint">昨日数据需在 00:30 后生成</div>
          </div>
          <div class="query-bar">
            <Space.Compact>
              <span class="query-field-addon">推广账号</span>
              <Select
                v-model:value="filterAdminId"
                allow-clear
                :options="teamAccountOptions"
                show-search
                style="width: 220px"
                placeholder="请选择推广账号"
              />
            </Space.Compact>
            <div class="query-filter-wide">
              <QueryDatetimeRangePicker
                v-model="filterDateRange"
                :max-range-days="30"
                precision="date"
              />
            </div>
            <Button type="primary" @click="loadData">查询</Button>
            <Button @click="reset">重置</Button>
          </div>
        </div>

        <SummaryCards :items="historySummaryItems" />

        <Table
          :columns="columns"
          :data-source="rows"
          :pagination="false"
          :row-key="(row) => String(row.ReportDay)"
          :scroll="{ x: isProfitMode ? 1650 : 1400 }"
          bordered
          size="small"
        >
          <template #headerCell="{ column }">
            <span>{{ column.title }}</span>
            <Tooltip
              v-if="column.key && headerHelp(String(column.key))"
              :title="headerHelp(String(column.key))"
            >
              <span class="info-dot">?</span>
            </Tooltip>
          </template>
          <template #bodyCell="{ column, record }">
            <span v-if="column.key">
              {{ cellValue(record, String(column.key)) }}
            </span>
          </template>
        </Table>
      </section>
    </div>
    <Result v-else status="403" sub-title="无代理日报查看权限" title="403" />
  </Spin>
</template>

<style scoped>
.daily-section {
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.history-header,
.query-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.query-bar {
  justify-content: flex-end;
  padding: 12px;
  background: hsl(var(--muted) / 35%);
  border-radius: 8px;
}

.history-hint {
  margin-top: -8px;
  font-size: 12px;
  color: #cf1322;
}

.info-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  font-size: 11px;
  color: #fff;
  cursor: help;
  background: #8c8c8c;
  border-radius: 50%;
}
</style>
