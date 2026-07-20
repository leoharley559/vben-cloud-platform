import BigNumber from 'bignumber.js';

import { formatPercent, formatSeconds } from '#/views/dataClose/shared/report-utils';

export type CompareBucket = Record<string, unknown>;

const MONEY_FIELDS = [
  'SumFirstPayMoney',
  'SumTransBetMoney1',
  'SumTransBetValidMoney1',
  'SumTransWinMoney1',
  'SumWithdrawMoney',
  'SumPayMoney',
  'SumPayMergerMoney',
  'SumAgentPayMoney',
  'SumBetWaterMoney',
  'SumApiFeeSumNum',
  'SumRedSumNum',
  'SumAgentCommissionSumNum',
] as const;

export function num(value: unknown) {
  return Number(value || 0);
}

export function countRate(current: unknown, base: unknown) {
  const a = num(current);
  const b = num(base);
  if ((a === 0 && b !== 0) || (a && b)) {
    return b < 0 ? -(((a - b) / b) * 100) : ((a - b) / b) * 100;
  }
  return Number.NaN;
}

export function formatDelta(value: unknown) {
  if (value === '-' || value === null || value === undefined) return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(2)}%`;
}

export function deltaColor(value: unknown) {
  const n = Number(String(value).replace('%', ''));
  if (!Number.isFinite(n) || n === 0) return '';
  return n > 0 ? '#49A54D' : 'red';
}

export function disposeMoneyBuckets(data: Record<string, CompareBucket>) {
  const result: Record<string, CompareBucket> = {};
  for (const [key, bucket] of Object.entries(data || {})) {
    if (key === 'LastMonthExist' || !bucket || typeof bucket !== 'object') {
      continue;
    }
    const next: CompareBucket = { ...bucket };
    for (const field of MONEY_FIELDS) {
      next[field] = new BigNumber(num(bucket[field])).dividedBy(100).toFixed(2);
    }
    next.SumAccountChangeSumNum = Math.abs(
      Number(
        new BigNumber(num(bucket.SumAccountChangeSumNum))
          .dividedBy(100)
          .toFixed(2),
      ),
    );
    result[key] = next;
  }
  return result;
}

export function applyCompareFormulas(data: Record<string, CompareBucket>) {
  const result: Record<string, CompareBucket> = {};
  for (const [key, bucket] of Object.entries(data || {})) {
    if (key === 'LastMonthExist' || !bucket) continue;
    const next: CompareBucket = { ...bucket };
    next.PerCapita = num(bucket.SumFirstPayMoney)
      ? (num(bucket.SumFirstPayMoney) / num(bucket.SumFirstPayNum)).toFixed(2)
      : '0.00';
    next.PercentConversion = num(bucket.SumReg)
      ? ((num(bucket.SumFirstPayNum) / num(bucket.SumReg)) * 100).toFixed(2)
      : '0.00';
    next.SufficientExchange = num(bucket.SumWithdrawMoney)
      ? (
          (num(bucket.SumWithdrawMoney) /
            (num(bucket.SumPayMoney) + num(bucket.SumAgentPayMoney) || 1)) *
          100
        ).toFixed(2)
      : '0.00';
    const firm = num(bucket.SumTransBetMoney1) - num(bucket.SumTransWinMoney1);
    next.FirmBunko = firm.toFixed(2);
    next.Surplus = num(bucket.SumTransBetMoney1)
      ? ((firm / num(bucket.SumTransBetMoney1)) * 100).toFixed(2)
      : '0.00';
    next.FullBring = (
      num(bucket.SumPayMergerMoney) - num(bucket.SumWithdrawMoney)
    ).toFixed(2);
    next.Income = (
      num(bucket.SumTransBetMoney1) -
      num(bucket.SumTransWinMoney1) +
      num(bucket.SumAccountChangeSumNum) -
      num(bucket.SumRedSumNum) -
      num(bucket.SumBetWaterMoney) -
      num(bucket.SumAgentCommissionSumNum)
    ).toFixed(2);
    next.GrossMargin = num(bucket.SumTransBetMoney1)
      ? ((num(next.Income) / num(bucket.SumTransBetMoney1)) * 100).toFixed(2)
      : '0.00';
    result[key] = next;
  }
  return result;
}

const RATE_FIELDS = new Set([
  'SufficientExchange',
  'PercentConversion',
  'Surplus',
  'GrossMargin',
  'PerCapita',
]);

export function buildMetricRow(
  data: Record<string, CompareBucket>,
  field: string,
  beginTs: number,
  beforeTs: number,
) {
  const row: CompareBucket = {};
  for (const [key, bucket] of Object.entries(data)) {
    if (key === 'LastMonthExist') continue;
    row[key] = bucket?.[field];
  }
  row.TodayItems = row.TodayItems ?? 0;
  row.YestDayItems = formatDelta(countRate(row.TodayItems, row.YestDayItems));
  row.CompareMonth =
    beginTs > beforeTs
      ? formatDelta(countRate(row.TodayItems, row.BeforeDayItems))
      : formatDelta(countRate(row.BeforeDayItems, row.TodayItems));
  if (RATE_FIELDS.has(field)) {
    row.Day7Items = formatDelta(countRate(row.TodayItems, row.Day7Items));
    row.Day30Items = formatDelta(countRate(row.TodayItems, row.Day30Items));
  } else {
    row.Day7Items = formatDelta(
      countRate(row.TodayItems, num(row.Day7Items) / 7),
    );
    row.Day30Items = formatDelta(
      countRate(row.TodayItems, num(row.Day30Items) / 30),
    );
  }
  row.LastWeekItems = formatDelta(countRate(row.TodayItems, row.LastWeekItems));
  row.LastMonthItems = formatDelta(
    countRate(row.TodayItems, row.LastMonthItems),
  );
  return row;
}

/** 公司收入（运营日报）：bet-win - change - red - water - commission */
export function calcCompanyIncome(item: CompareBucket) {
  return (
    num(item.SumTransBetMoney1) -
    num(item.SumTransWinMoney1) -
    num(item.SumAccountChangeSumNum) -
    num(item.SumRedSumNum) -
    num(item.SumBetWaterMoney) -
    num(item.SumAgentCommissionSumNum)
  );
}

export function calcCompanyWin(item: CompareBucket) {
  return num(item.SumTransBetMoney1) - num(item.SumTransWinMoney1);
}

export function calcOperatingCost(item: CompareBucket) {
  return (
    num(item.SumRedSumNum) +
    num(item.SumBetWaterMoney) -
    -num(item.SumAccountChangeSumNum) +
    num(item.SumAgentCommissionSumNum) +
    num(item.SumApiFeeSumNum)
  );
}

export function durationText(seconds: unknown) {
  return formatSeconds(seconds);
}

export function percentText(a: unknown, b: unknown) {
  return formatPercent(num(a), num(b));
}

export type CompareMetricDef = {
  field: string;
  label: string;
  permission?: number;
  section: string;
  isRate?: boolean;
};

export const COMPARE_METRICS: CompareMetricDef[] = [
  { field: 'SumReg', label: '注册人数', permission: 10_518, section: '推广力度' },
  {
    field: 'SumFirstPayNum',
    label: '首存人数',
    permission: 10_518,
    section: '推广力度',
  },
  {
    field: 'PercentConversion',
    label: '转化率',
    permission: 10_518,
    section: '推广力度',
    isRate: true,
  },
  {
    field: 'SumFirstPayMoney',
    label: '首存金额',
    permission: 10_518,
    section: '推广力度',
  },
  {
    field: 'PerCapita',
    label: '人均首存',
    permission: 10_518,
    section: '推广力度',
  },
  { field: 'SumLogin', label: '登录人数', permission: 10_519, section: '核心数据' },
  {
    field: 'SumTransBetNum1',
    label: '投注人数',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SumPayMergerNum',
    label: '充值人数',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SumWithdrawNum',
    label: '提现人数',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SumPayMergerMoney',
    label: '充值金额',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SumWithdrawMoney',
    label: '提现金额',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'FullBring',
    label: '充提差',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SufficientExchange',
    label: '兑充率',
    permission: 10_519,
    section: '核心数据',
    isRate: true,
  },
  {
    field: 'SumTransBetMoney1',
    label: '投注金额',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'SumTransBetValidMoney1',
    label: '有效投注金额',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'FirmBunko',
    label: '公司输赢',
    permission: 10_519,
    section: '核心数据',
  },
  {
    field: 'Surplus',
    label: '盈率',
    permission: 10_519,
    section: '核心数据',
    isRate: true,
  },
  {
    field: 'SumBetWaterMoney',
    label: '返水金额',
    permission: 10_520,
    section: '运营成本',
  },
  {
    field: 'SumRedSumNum',
    label: '红利金额',
    permission: 10_520,
    section: '运营成本',
  },
  {
    field: 'SumAccountChangeSumNum',
    label: '输赢调整',
    permission: 10_520,
    section: '运营成本',
  },
  {
    field: 'SumAgentCommissionSumNum',
    label: '代理佣金',
    permission: 10_520,
    section: '运营成本',
  },
  {
    field: 'SumApiFeeSumNum',
    label: '场馆费',
    permission: 10_520,
    section: '运营成本',
  },
  { field: 'Income', label: '收入', permission: 10_521, section: '收入' },
  {
    field: 'GrossMargin',
    label: '毛利率',
    permission: 10_521,
    section: '收入',
    isRate: true,
  },
];
