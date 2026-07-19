/** 数据总览辅助：金额 / 环比 / 时长 */

import dayjs from 'dayjs';

export function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 统一成 YYYY-MM-DD，兼容时间戳 / ISO / 斜杠日期 */
export function normalizeReportDay(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = dayjs(ms);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  const text = String(value).trim();
  if (/^\d{10,13}$/.test(text)) {
    const num = Number(text);
    const ms = text.length <= 10 ? num * 1000 : num;
    const d = dayjs(ms);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  const parsed = dayjs(text.replaceAll('/', '-'));
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }
  return text.slice(0, 10);
}

function toHourRows(value: unknown): Array<Record<string, unknown>> {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value as Array<Record<string, unknown>>;
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(
      (item) => item && typeof item === 'object',
    ) as Array<Record<string, unknown>>;
  }
  return [];
}

/**
 * 规范化 TotalHours / TotalCount：
 * - 解析 JSON 字符串
 * - 日期 key → YYYY-MM-DD
 * - 值统一为数组
 */
export function normalizeTimedMap(
  raw: unknown,
): Record<string, Array<Record<string, unknown>>> {
  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (!data || typeof data !== 'object') {
    return {};
  }

  // 兼容 [{ ReportDay, Items/Hours: [] }]
  if (Array.isArray(data)) {
    const mapped: Record<string, Array<Record<string, unknown>>> = {};
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const day = normalizeReportDay(row.ReportDay || row.Date || row.Day);
      if (!day) continue;
      mapped[day] = toHourRows(
        row.Items || row.Hours || row.Data || row.List || row,
      );
    }
    return mapped;
  }

  const mapped: Record<string, Array<Record<string, unknown>>> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const day = normalizeReportDay(key);
    if (!day) continue;
    mapped[day] = toHourRows(value);
  }
  return mapped;
}

/** 分转元（整数展示，对齐旧站 count-to） */
export function centsToYuan(value: unknown) {
  return Math.round(toNumber(value) / 100);
}

/** 环比百分比文案，如 +12% / -3% */
export function formatComparePercent(diff: number, base: number) {
  if (!base) {
    return `+${diff > 0 ? 100 : 0}%`;
  }
  const pct = (diff / base) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}

export function formatRatePercent(rate: number, digits = 0) {
  return `${(toNumber(rate) * 100).toFixed(digits)}%`;
}

/** 秒转可读时长 */
export function formatSeconds(value: unknown) {
  const total = Math.max(0, Math.floor(toNumber(value)));
  if (!total) {
    return '0 秒';
  }
  if (total < 60) {
    return `${total} 秒`;
  }
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} 天`);
  if (hours) parts.push(`${hours} 小时`);
  if (minutes) parts.push(`${minutes} 分`);
  if (seconds || parts.length === 0) parts.push(`${seconds} 秒`);
  return parts.join(' ');
}

export function formatDeltaPercent(today: number, yesterday: number) {
  if (!yesterday) {
    return '0%';
  }
  return `${Math.abs(((today - yesterday) / yesterday) * 100).toFixed(0)}%`;
}

export type PanelMetricKey =
  | 'SumOnlinePlayerNum'
  | 'SumTransBetMoney1'
  | 'SumTransWinMoney1'
  | 'WinSubBet'
  | 'SumTotalPayMoney'
  | 'SumWithdrawMoney'
  | 'profits';

export interface PanelMetricDef {
  calc: (row: Record<string, unknown>) => number;
  hasDigits: boolean;
  key: PanelMetricKey;
  label: string;
  /** TotalCount 字段名（在线人数） */
  totalCountField?: string;
}

function payAmount(row: Record<string, unknown>) {
  if (row.SumPayMergerMoney !== undefined && row.SumPayMergerMoney !== null) {
    return toNumber(row.SumPayMergerMoney);
  }
  return toNumber(row.SumPayMoney) + toNumber(row.SumAgentPayMoney);
}

export const PANEL_METRICS: PanelMetricDef[] = [
  {
    calc: (row) => toNumber(row.Count),
    hasDigits: false,
    key: 'SumOnlinePlayerNum',
    label: '在线人数',
    totalCountField: 'Count',
  },
  {
    calc: (row) => toNumber(row.SumTransBetMoney1),
    hasDigits: true,
    key: 'SumTransBetMoney1',
    label: '投注金额',
  },
  {
    calc: (row) => toNumber(row.SumTransWinMoney1),
    hasDigits: true,
    key: 'SumTransWinMoney1',
    label: '返奖金额',
  },
  {
    calc: (row) =>
      toNumber(row.SumTransBetMoney1) - toNumber(row.SumTransWinMoney1),
    hasDigits: true,
    key: 'WinSubBet',
    label: '盈利',
  },
  {
    calc: (row) => payAmount(row),
    hasDigits: true,
    key: 'SumTotalPayMoney',
    label: '充值金额',
  },
  {
    calc: (row) => toNumber(row.SumWithdrawMoney),
    hasDigits: true,
    key: 'SumWithdrawMoney',
    label: '兑换金额',
  },
  {
    calc: (row) => payAmount(row) - toNumber(row.SumWithdrawMoney),
    hasDigits: true,
    key: 'profits',
    label: '充兑差',
  },
];

export const VISIBLE_PANEL_KEYS: PanelMetricKey[] = [
  'SumTransBetMoney1',
  'SumTransWinMoney1',
  'WinSubBet',
  'SumTotalPayMoney',
  'SumWithdrawMoney',
  'profits',
];

export const CHART_COLORS = [
  '#67C23A',
  '#409EFF',
  '#E6A23C',
  '#F56C6C',
  '#CC99FF',
];

/** 场馆 ID → 名称（对齐旧站 formatGameId） */
export function formatGameId(
  gameId: unknown,
  games: Record<string, { gameName?: string }>,
) {
  const id = String(gameId ?? '');
  if (!id || id === '0') return '-';
  if (id === '-1') return '离线';
  return games[id]?.gameName || id;
}
