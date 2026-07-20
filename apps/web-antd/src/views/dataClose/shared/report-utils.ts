import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';

import { formatAmount, formatAmountFromCent } from '#/utils/format-amount';

export type ReportDatePreset =
  | 'dayBeforeYesterday'
  | 'last7Days'
  | 'last7ToToday'
  | 'previousDayToToday'
  | 'statYesterdayToToday'
  | 'yesterday'
  | 'yesterdayWholeDay';

export function resolveReportRange(
  preset: ReportDatePreset = 'last7Days',
): [Dayjs, Dayjs] {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  switch (preset) {
    case 'yesterday':
    case 'yesterdayWholeDay': {
      return [yesterday, yesterday.endOf('day')];
    }
    case 'dayBeforeYesterday': {
      const day = today.subtract(2, 'day');
      return [day, day.endOf('day')];
    }
    case 'previousDayToToday': {
      return [yesterday, today.endOf('day')];
    }
    case 'statYesterdayToToday': {
      return [yesterday, today.subtract(1, 'second')];
    }
    case 'last7ToToday': {
      return [today.subtract(6, 'day'), today.endOf('day')];
    }
    default: {
      return [today.subtract(6, 'day'), yesterday.endOf('day')];
    }
  }
}

export function toUnixRange(
  range?: [Dayjs, Dayjs] | null,
  options?: { endExclusive?: boolean },
) {
  if (!range?.[0] || !range?.[1]) {
    return { BeginTime: undefined, EndTime: undefined };
  }
  return {
    BeginTime: range[0].startOf('day').unix(),
    EndTime: options?.endExclusive
      ? range[1].endOf('day').unix()
      : range[1].endOf('day').unix(),
  };
}

export function toDateStringRange(
  range?: [Dayjs, Dayjs] | null,
  format = 'YYYY-MM-DD',
) {
  if (!range?.[0] || !range?.[1]) {
    return { BeginTime: '', EndTime: '' };
  }
  return {
    BeginTime: range[0].format(format),
    EndTime: range[1].format(format),
  };
}

export function toMonthRange(range?: [Dayjs, Dayjs] | null) {
  if (!range?.[0] || !range?.[1]) {
    return { BeginTime: '', EndTime: '' };
  }
  return {
    BeginTime: range[0].startOf('month').unix(),
    EndTime: range[1].endOf('month').unix(),
  };
}

export function arrayToCsvParam(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(',') : undefined;
  }
  return value === '' || value === null || value === undefined
    ? undefined
    : value;
}

export function formatPercent(
  numerator: number,
  denominator: number,
  digits = 2,
) {
  if (!denominator) return '0%';
  return `${new BigNumber(numerator)
    .dividedBy(denominator)
    .multipliedBy(100)
    .toFixed(digits)}%`;
}

export function formatRatio(value: unknown, digits = 2) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(digits)}%`;
}

export function formatSeconds(seconds: unknown) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** 在线时长（对齐旧版 formatSecond：超过 1 小时仅显示小时） */
export function formatOnlineDuration(seconds: unknown) {
  const value = Math.floor(Number(seconds) || 0);
  if (!value) return String(seconds ?? 0);
  if (value < 60) return `${value}秒`;
  let remain = value;
  let minute = Math.floor(remain / 60);
  remain = remain % 60;
  let hour = 0;
  if (minute >= 60) {
    hour = Math.floor(minute / 60);
    minute = minute % 60;
  }
  if (hour > 0) return `${hour}小时`;
  let result = '';
  if (remain > 0) {
    result = `${remain >= 10 ? remain : `0${remain}`}秒`;
  }
  if (minute > 0) {
    result = `${minute >= 10 ? minute : `0${minute}`}分${result}`;
  }
  return result || '< 1';
}

/** 离线时长（对齐旧版 formatSecond1：优先显示天） */
export function formatOfflineDuration(seconds: unknown) {
  const value = Math.floor(Number(seconds) || 0);
  if (!value) return '-';
  if (value < 60) return `${value}秒`;
  let remain = value;
  let minute = Math.floor(remain / 60);
  remain = remain % 60;
  let hour = 0;
  let day = 0;
  if (minute >= 60) {
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    if (hour >= 24) {
      day = Math.floor(hour / 24);
      hour = hour % 24;
    }
  }
  if (day > 0) return `${day}天`;
  let result = '';
  if (minute > 0) {
    result = `${minute >= 10 ? minute : `0${minute}`}分`;
  }
  if (hour > 0) {
    result = `${hour}小时${result}`;
  }
  return result || '< 1天';
}

/** 充兑比（对齐旧版 calcRatio） */
export function calcChargeExchangeRatio(recharge: unknown, withdraw: unknown) {
  const w = Number(withdraw || 0);
  const r = Number(recharge || 0);
  if (!w) return '0%';
  if (w > 0 && !r) {
    return `${((w / 10) * 100).toFixed(2)}%`;
  }
  return `${((w / r) * 100).toFixed(2)}%`;
}

export function stripPhonePrefix(phone: unknown) {
  const text = String(phone ?? '').trim();
  if (!text) return '-';
  if (text.includes('_')) {
    return text.split('_').slice(1).join('_') || '-';
  }
  return text;
}

export function formatReportDateTime(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text || text === '0' || text === '0001-01-01T00:00:00Z') return '-';
  const num = Number(text);
  if (Number.isFinite(num) && num > 1_000_000_000) {
    return dayjs.unix(num).format('YYYY-MM-DD HH:mm:ss');
  }
  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : text;
}

export function cents(value: unknown) {
  return formatAmountFromCent(Number(value || 0));
}

export function amount(value: unknown) {
  return formatAmount(Number(value || 0));
}

export function calcProfit(bet: unknown, win: unknown, other: unknown = 0) {
  return new BigNumber(bet || 0)
    .minus(win || 0)
    .plus(other || 0)
    .toNumber();
}

export function calcProfitRate(bet: unknown, win: unknown, other: unknown = 0) {
  const betNum = Number(bet || 0);
  if (!betNum) return '0%';
  return formatPercent(calcProfit(bet, win, other), betNum);
}

export async function exportRowsToXlsx(
  rows: Record<string, unknown>[],
  headers: string[],
  fileName: string,
  mapper: (row: Record<string, unknown>, index: number) => unknown[],
) {
  const XLSX = await import('xlsx');
  const data = [headers, ...rows.map((row, index) => mapper(row, index))];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(book, name);
}

export function copyTableText(headers: string[], rows: string[][]) {
  const text = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join(
    '\n',
  );
  return navigator.clipboard.writeText(text);
}
