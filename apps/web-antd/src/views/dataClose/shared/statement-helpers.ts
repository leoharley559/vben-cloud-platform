import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { message } from 'ant-design-vue';

import { amount, calcProfit, cents } from './report-utils';

export type StatementRow = Record<string, unknown>;

export type AgentNode = { Id: number | string; Username: string };

export function asNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function fromCent(value: unknown) {
  return asNumber(value) / 100;
}

export function joinParam(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(',') : '';
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

export function resolveTotalSum(moreItems: unknown): StatementRow {
  if (!moreItems || typeof moreItems !== 'object') return {};
  const total = (moreItems as StatementRow).TotalSum;
  if (total && typeof total === 'object') return total as StatementRow;
  return moreItems as StatementRow;
}

export function mapItemsAgents(raw: unknown): AgentNode[] {
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw as Record<string, string>).map(([Id, Username]) => ({
    Id,
    Username: Username || String(Id),
  }));
}

export function venueName(
  map: Record<string, string>,
  platformGameType: unknown,
) {
  const key = String(platformGameType ?? '');
  if (!key) return '-';
  return map[key] || '-';
}

export function parseServiceRate(rate: unknown): Array<[string, string]> {
  const text = String(rate ?? '').trim();
  if (!text) return [];
  return text.split(';').map((part) => {
    const [cross = '-', percent = '0'] = part.split(':');
    return [cross, percent];
  });
}

export function formatCrossLabel(cross: string) {
  return cross === '-' ? '无限' : cross;
}

/** 校验日期间隔（含首尾），超限返回 false */
export function ensureDaySpan(
  range: [Dayjs, Dayjs] | null | undefined,
  maxDays: number,
  label = '日期',
) {
  if (!range?.[0] || !range?.[1]) {
    message.warning(`请选择${label}范围`);
    return false;
  }
  const span = range[1].startOf('day').diff(range[0].startOf('day'), 'day') + 1;
  if (span > maxDays) {
    message.warning(`${label}范围最长 ${maxDays} 天`);
    return false;
  }
  return true;
}

export function ensureMonthSpan(
  range: [Dayjs, Dayjs] | null | undefined,
  maxDays: number,
) {
  if (!range?.[0] || !range?.[1]) {
    message.warning('请选择月份范围');
    return false;
  }
  const begin = range[0].startOf('month');
  const end = range[1].endOf('month');
  const span = end.startOf('day').diff(begin.startOf('day'), 'day') + 1;
  if (span > maxDays) {
    message.warning(`月份范围最长约 ${maxDays} 天`);
    return false;
  }
  return true;
}

export function defaultMonthRange(): [Dayjs, Dayjs] {
  // 对齐旧站 getBeforeDateStr(61)～今天：落到整月（约近 3 个自然月）
  return [
    dayjs().subtract(61, 'day').startOf('month'),
    dayjs().subtract(1, 'day').startOf('month'),
  ];
}

/** 子包网月报：limit≈62 天，最多两个自然月（整月展开后仍 ≤62） */
export function defaultSonMonthRange(): [Dayjs, Dayjs] {
  return [
    dayjs().subtract(1, 'month').startOf('month'),
    dayjs().startOf('month'),
  ];
}

export function dayDetailUnix(reportDay: unknown) {
  const d = dayjs(String(reportDay || ''));
  if (!d.isValid()) {
    return { BeginTime: undefined, EndTime: undefined };
  }
  return {
    BeginTime: d.startOf('day').unix(),
    EndTime: d.endOf('day').unix(),
  };
}

export function monthDetailUnix(reportMonth: unknown) {
  const m = dayjs(String(reportMonth || ''), 'YYYY-MM');
  if (!m.isValid()) {
    return { BeginTime: undefined, EndTime: undefined };
  }
  return {
    BeginTime: m.startOf('month').unix(),
    EndTime: m.endOf('month').unix(),
  };
}

export function mapDayMoneyRow(
  row: StatementRow,
  map: Record<string, string>,
  options?: { includePositive?: boolean },
) {
  const SelfBetGold = fromCent(row.SelfBetGold);
  const SelfWinGold = fromCent(row.SelfWinGold);
  const SelfOtherGold = fromCent(row.SelfOtherGold);
  const ProfitLose = Number(
    calcProfit(SelfBetGold, SelfWinGold, SelfOtherGold).toFixed(2),
  );
  const next: StatementRow = {
    ...row,
    AgentName: venueName(map, row.PlatformGameType),
    SelfBetGold,
    SelfWinGold,
    SelfOtherGold,
    ProfitLose,
  };
  if (options?.includePositive) {
    next.Positive = fromCent(row.Positive);
    next.Negative = fromCent(row.Negative);
  }
  return next;
}

export function mapMonthMoneyRow(
  row: StatementRow,
  map: Record<string, string>,
) {
  const SumSelfBetGold = fromCent(row.SumSelfBetGold);
  const SumSelfWinGold = fromCent(row.SumSelfWinGold);
  const SumSelfOtherGold = fromCent(row.SumSelfOtherGold);
  const ProfitLose = Number(
    calcProfit(SumSelfBetGold, SumSelfWinGold, SumSelfOtherGold).toFixed(2),
  );
  return {
    ...row,
    AgentName: venueName(map, row.PlatformGameType),
    MustGetTaxMoney: fromCent(row.MustGetTaxMoney),
    ProfitLose,
    SumNegative: fromCent(row.SumNegative),
    SumPositive: fromCent(row.SumPositive),
    SumSelfBetGold,
    SumSelfOtherGold,
    SumSelfWinGold,
  };
}

export function profitClass(value: unknown) {
  return asNumber(value) < 0 ? 'text-red-500' : 'text-green-600';
}

export function displayCent(value: unknown) {
  return cents(value);
}

export function displayAmount(value: unknown) {
  return amount(value);
}

export function footerProfitFromTotal(total: StatementRow) {
  return calcProfit(
    total.SumSelfBetGold,
    total.SumSelfWinGold,
    total.SumSelfOtherGold,
  );
}
