import type { Dayjs } from 'dayjs';

import type { GameTypeLangGroupItem } from '#/utils/game-config';

import dayjs from 'dayjs';

import { normalizeSearchValue } from '#/utils/everyday-report-format';
import {
  arrayToCsvParam,
  calcProfit,
  calcProfitRate,
  cents,
  toUnixRange,
} from '#/views/dataClose/shared/report-utils';

export type GameStatementTab = 'classified' | 'game' | 'subGame';

export interface GameStatementRow extends Record<string, unknown> {
  Cost?: number;
  CountBetNum?: number;
  CountNum?: number;
  GameHotRank?: number | string;
  GamePlatformType?: number | string;
  GameRank?: number | string;
  GameType?: number | string;
  ReportDay?: string;
  Rtp?: number | string;
  SubGameId?: number | string;
  SumBet?: number;
  SumOther?: number;
  SumValidBet?: number;
  SumWin?: number;
}

/** 默认当月：月初 00:00～今天 23:59 */
export function defaultMonthRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('day')];
}

/** 对齐旧站 getBeforeDateTimestamp(1,false)～getBeforeDateTimestamp()：今天 00:00～23:59 */
export function defaultTodayRange(): [Dayjs, Dayjs] {
  const today = dayjs().startOf('day');
  return [today, today.endOf('day')];
}

/** @deprecated 历史命名；实际已对齐旧站「今天」，请优先用 defaultTodayRange */
export function defaultYesterdayRange(): [Dayjs, Dayjs] {
  return defaultTodayRange();
}

export function buildCommonQuery(input: {
  adminGroupIds?: Array<number | string>;
  adminSearch: Array<number | string> | number | string;
  adminSearchType: number;
  appUrl?: Array<number | string>;
  channelSearch: Array<number | string> | number | string;
  channelSearchType: number;
  dateRange?: [Dayjs, Dayjs] | null;
  packageId?: number | string;
}) {
  const { BeginTime, EndTime } = toUnixRange(input.dateRange);
  return {
    AdminGroupIds: arrayToCsvParam(input.adminGroupIds) || '',
    AdminSearch: normalizeSearchValue(input.adminSearch, input.adminSearchType),
    AdminSearchType: input.adminSearchType,
    AppUrl: arrayToCsvParam(input.appUrl) || '',
    BeginTime,
    ChannelSearch: normalizeSearchValue(
      input.channelSearch,
      input.channelSearchType,
    ),
    ChannelSearchType: input.channelSearchType,
    EndTime,
    PackageId: input.packageId || '',
  };
}

export function getGameCategoryName(
  type: number | string | undefined,
  group: Record<string, GameTypeLangGroupItem>,
  locale = 'zh-CN',
) {
  if (type === undefined || type === null || type === '') return '-';
  const item = group[String(type)];
  if (!item?.Langs?.length) return String(type);
  const hit =
    item.Langs.find((lang) => lang.Lang === locale) ||
    item.Langs.find((lang) => lang.Lang === 'zh-CN') ||
    item.Langs[0];
  return hit?.Name || String(type);
}

export function parseMyPlatformGameTypes(raw: unknown): Array<number | string> {
  if (Array.isArray(raw)) return raw.filter((item) => item !== '');
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function applyVenueFee(
  rows: GameStatementRow[],
  venueRates: Array<{ ApiName?: number | string; Fee?: number }>,
  isNegativeWinCount: boolean,
) {
  let totalCost = 0;
  const next = rows.map((row) => {
    const profit = calcProfit(row.SumBet, row.SumWin);
    const rate = venueRates.find(
      (item) => String(item.ApiName) === String(row.GameType),
    );
    const fee = Number(rate?.Fee || 0);
    let cost = 0;
    if (isNegativeWinCount || profit > 0) {
      cost = profit * (fee / 10_000);
    }
    totalCost += cost;
    return { ...row, Cost: cost };
  });
  return { rows: next, totalCost };
}

export function profitText(row: GameStatementRow) {
  return cents(calcProfit(row.SumBet, row.SumWin));
}

export function profitRateText(row: GameStatementRow) {
  return calcProfitRate(row.SumBet, row.SumWin);
}

export function profitClass(row: GameStatementRow) {
  return calcProfit(row.SumBet, row.SumWin) < 0
    ? 'text-red-500'
    : 'text-green-600';
}

export function disabledDateBeyond90(
  current: Dayjs,
  range: [Dayjs, Dayjs] | undefined,
  picking: 'end' | 'start' | null,
) {
  if (!current) return false;
  if (!range?.[0] || picking === 'start') return false;
  const start = range[0];
  return (
    current.isAfter(start.add(89, 'day'), 'day') ||
    current.isBefore(start.subtract(89, 'day'), 'day')
  );
}
