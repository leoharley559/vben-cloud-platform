import type { CloudListResult } from '#/types/operation-manage';

import { formatAmountFromCent } from '#/utils/format-amount';
import {
  LEADERBOARD_INVITE_TYPE,
  LEADERBOARD_TYPE_MAP,
  formatOperationDateTime,
} from '#/utils/operation-status';

export const LEADERBOARD_TYPE = {
  DEPO: 1,
  BET: 2,
  PROFIT: 3,
  INVITES: 4,
} as const;

export const LEADERBOARD_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '存款', value: LEADERBOARD_TYPE.DEPO },
  { label: '有效投注', value: LEADERBOARD_TYPE.BET },
  { label: '盈利', value: LEADERBOARD_TYPE.PROFIT },
  { label: '邀请人数', value: LEADERBOARD_TYPE.INVITES },
];

export const LEADERBOARD_CLAIM_STATUS_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '未领取', value: 0 },
  { label: '已领取', value: 1 },
];

export function formatLeaderboardType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return LEADERBOARD_TYPE_MAP[Number(value)] || String(value);
}

export function formatLeaderboardScore(
  activityType?: number | string,
  score?: number | string,
) {
  if (score === undefined || score === null || score === '') {
    return '-';
  }
  const numeric = Number(score);
  if (Number.isNaN(numeric)) {
    return String(score);
  }
  if (Number(activityType) === LEADERBOARD_INVITE_TYPE) {
    return String(numeric);
  }
  return formatAmountFromCent(numeric);
}

export function formatLeaderboardAmount(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = Number(value);
  if (!numeric) {
    return '-';
  }
  return formatAmountFromCent(numeric);
}

export function formatLeaderboardInactiveMode(value?: number | string) {
  return Number(value) === 1 ? '自动下架' : '手动下架';
}

export function formatLeaderboardClaimStatus(value?: number | string) {
  if (Number(value) === 1) {
    return '已领取';
  }
  if (Number(value) === 0) {
    return '未领取';
  }
  return String(value ?? '-');
}

export function formatLeaderboardDateTime(value?: number | string) {
  return formatOperationDateTime(value);
}

export function normalizeCloudList<T>(data: unknown): CloudListResult<T> {
  if (Array.isArray(data)) {
    return { Items: data as T[] };
  }
  if (data && typeof data === 'object') {
    const record = data as CloudListResult<T> & { Data?: CloudListResult<T> };
    if (Array.isArray(record.Items)) {
      return record;
    }
    if (record.Data && Array.isArray(record.Data.Items)) {
      return record.Data;
    }
  }
  return { Items: [] };
}

export function normalizeCloudObject<T extends Record<string, unknown>>(
  data: unknown,
): T | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown> & { Items?: unknown };
  if (
    record.Items &&
    typeof record.Items === 'object' &&
    !Array.isArray(record.Items)
  ) {
    return record.Items as T;
  }
  if (Array.isArray(record.Items)) {
    return (record.Items[0] as T) || null;
  }
  return record as T;
}

export function parseLangTextMap(raw: unknown) {
  if (!raw) {
    return {} as Record<string, Record<string, unknown>>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Object.fromEntries(
          parsed.map((item) => [
            String(item.LangGroupId ?? item.Id ?? ''),
            item,
          ]),
        );
      }
      return parsed as Record<string, Record<string, unknown>>;
    } catch {
      return {};
    }
  }
  if (Array.isArray(raw)) {
    return Object.fromEntries(
      raw.map((item) => [String(item.LangGroupId ?? item.Id ?? ''), item]),
    );
  }
  return raw as Record<string, Record<string, unknown>>;
}

export function resolveLeaderboardTitle(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as { Title?: string } | undefined;
  if (first?.Title) {
    return first.Title;
  }
  if (typeof raw === 'object' && raw && 'Title' in (raw as object)) {
    return String((raw as { Title?: string }).Title || '-');
  }
  return '-';
}

export function resolveVoucherName(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as { Name?: string } | undefined;
  return first?.Name || '-';
}

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value || value === 'null') {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function buildDateStringRange(range?: [string, string] | null): {
  EndTime?: string;
  StartTime?: string;
} {
  if (!range?.[0] && !range?.[1]) {
    return {};
  }
  return {
    EndTime: range?.[1] || '',
    StartTime: range?.[0] || '',
  };
}
