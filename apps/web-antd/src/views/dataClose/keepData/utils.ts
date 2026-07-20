import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import { formatAmountFromCent } from '#/utils/format-amount';
import { formatPercent } from '#/views/dataClose/shared/report-utils';

export type KeepRow = Record<string, unknown>;

export type KeepDetailsParam = {
  page: 'retention' | 'login' | 'qujian' | 'ltv' | 'oneTime';
  type: string | number;
  date: string;
  days?: number;
  reportType?: number;
  ChannelIds?: string;
  AdminIds?: string;
  AdminGroupIds?: string;
  PackageId?: string | number;
  BeginTime?: string;
  EndTime?: string;
};

export const EXTANT_DAY_INDEXES = [1, 3, 4, 5, 6, 7, 15, 30, 60, 90];

export const LOGIN_DAY_COLUMNS = [
  { day: 2, field: 'Days1', label: '次日' },
  { day: 3, field: 'Days2', label: '3日留存' },
  { day: 4, field: 'Days3', label: '4日留存' },
  { day: 5, field: 'Days4', label: '5日留存' },
  { day: 6, field: 'Days5', label: '6日留存' },
  { day: 7, field: 'Days6', label: '7日留存' },
  { day: 15, field: 'Days14', label: '15日留存' },
  { day: 30, field: 'Days29', label: '30日留存' },
] as const;

export const SECTION_DAY_COLUMNS = [
  { day: 2, field: 'CountLogin2', label: '次日' },
  { day: 3, field: 'CountLogin3', label: '3日留存' },
  { day: 4, field: 'CountLogin4', label: '4日留存' },
  { day: 5, field: 'CountLogin5', label: '5日留存' },
  { day: 6, field: 'CountLogin6', label: '6日留存' },
  { day: 7, field: 'CountLogin7', label: '7日留存' },
  { day: 15, field: 'CountLogin15', label: '15日留存' },
  { day: 30, field: 'CountLogin30', label: '30日留存' },
  { day: 60, field: 'CountLogin60', label: '60日留存' },
] as const;

export const ONE_TIME_FIELDS = [
  'OneTime',
  'TwoTime',
  'ThreeTime',
  'FourTime',
  'FiveTime',
  'SixTime',
  'SevenTime',
  'SevenOrMore',
] as const;

export function defaultKeepDateRange(): [Dayjs, Dayjs] {
  const today = dayjs().startOf('day');
  return [today.subtract(6, 'day'), today.endOf('day')];
}

export function disabledKeepDate(current: Dayjs, picking?: Dayjs | null) {
  if (!current) return false;
  if (current.isAfter(dayjs().endOf('day'))) return true;
  if (!picking) return false;
  const min = picking.subtract(29, 'day').startOf('day');
  const max = picking.add(29, 'day').endOf('day');
  return current.isBefore(min) || current.isAfter(max);
}

export function num(value: unknown) {
  return Number(value || 0);
}

export function ratioText(numerator: unknown, denominator: unknown) {
  return formatPercent(num(numerator), num(denominator));
}

export function moneyText(value: unknown) {
  return formatAmountFromCent(num(value));
}

/** 登录留存：ItemsOld 按 RegisterDate 透视成 Days* 矩阵 */
export function pivotLoginRetention(items: KeepRow[]): KeepRow[] {
  const byDate = new Map<string, KeepRow[]>();
  for (const row of items) {
    const key = String(row.RegisterDate || '');
    if (!key) continue;
    const list = byDate.get(key) || [];
    list.push(row);
    byDate.set(key, list);
  }

  const result: KeepRow[] = [];
  for (const [RegisterDate, rows] of byDate) {
    const temp: KeepRow = {
      RegisterDate,
      SumReg: 0,
      Days1: 0,
      Days2: 0,
      Days3: 0,
      Days4: 0,
      Days5: 0,
      Days6: 0,
      Days14: 0,
      Days29: 0,
    };
    for (const item of rows) {
      switch (num(item.Days)) {
        case 0: {
          temp.SumReg = num(item.SumReg);
          break;
        }
        case 1: {
          temp.Days1 = num(item.SumLogin);
          break;
        }
        case 2: {
          temp.Days2 = num(item.SumLogin);
          break;
        }
        case 3: {
          temp.Days3 = num(item.SumLogin);
          break;
        }
        case 4: {
          temp.Days4 = num(item.SumLogin);
          break;
        }
        case 5: {
          temp.Days5 = num(item.SumLogin);
          break;
        }
        case 6: {
          temp.Days6 = num(item.SumLogin);
          break;
        }
        case 14: {
          temp.Days14 = num(item.SumLogin);
          break;
        }
        case 29: {
          temp.Days29 = num(item.SumLogin);
          break;
        }
      }
    }
    result.push(temp);
  }
  return result.sort((a, b) =>
    String(b.RegisterDate).localeCompare(String(a.RegisterDate)),
  );
}

/** LTV：ItemsOld 按 RegisterDate 透视 Days1..Days60 */
export function pivotLtvRows(items: KeepRow[]): KeepRow[] {
  const byDate = new Map<string, KeepRow[]>();
  for (const row of items) {
    const key = String(row.RegisterDate || '');
    if (!key) continue;
    const list = byDate.get(key) || [];
    list.push(row);
    byDate.set(key, list);
  }

  const result: KeepRow[] = [];
  for (const [RegisterDate, rows] of byDate) {
    const temp: KeepRow = { RegisterDate, SumReg: 0, SumPayMoney: 0 };
    for (let i = 1; i <= 60; i += 1) {
      temp[`Days${i}`] = 0;
    }
    for (const item of rows) {
      const days = num(item.Days);
      const pay = num(item.SumPayMoney) + num(item.SumAgentPayMoney);
      temp.SumPayMoney = num(temp.SumPayMoney) + pay;
      if (days === 0) {
        temp.SumReg = num(item.SumReg);
      }
      if (days >= 0 && days <= 59) {
        temp[`Days${days + 1}`] = pay;
      }
    }
    result.push(temp);
  }
  return result.sort((a, b) =>
    String(b.RegisterDate).localeCompare(String(a.RegisterDate)),
  );
}

function sumDays(row: KeepRow, indexes: number[]) {
  return indexes.reduce((acc, i) => acc + num(row[`Days${i}`]), 0);
}

/** 对齐旧版 LTV 公式（LTV15/30 跳过 Days11） */
export function calcLtv(row: KeepRow, key: string) {
  const reg = num(row.SumReg);
  if (!reg) return 0;
  const map: Record<string, number[]> = {
    LTV1: [1],
    LTV2: [1, 2],
    LTV3: [1, 2, 3],
    LTV4: [1, 2, 3, 4],
    LTV5: [1, 2, 3, 4, 5],
    LTV7: [1, 2, 3, 4, 5, 6, 7],
    LTV15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15],
    LTV30: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
      23, 24, 25, 26, 27, 28, 29, 30,
    ],
  };
  const indexes = map[key];
  if (!indexes) return 0;
  return sumDays(row, indexes) / reg;
}

export function loadLtvVisibility(): boolean[] {
  try {
    const raw = localStorage.getItem('ltv');
    if (!raw) return [false, false, false, false, false];
    const parsed = JSON.parse(raw) as boolean[];
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return [...parsed, false, false].slice(0, 5);
    }
  } catch {
    /* ignore */
  }
  return [false, false, false, false, false];
}

export function saveLtvVisibility(flags: boolean[]) {
  localStorage.setItem('ltv', JSON.stringify(flags));
}

export function keepDetailsTitle(page: KeepDetailsParam['page']) {
  const map: Record<KeepDetailsParam['page'], string> = {
    retention: '留存',
    login: '登录留存',
    qujian: '区间留存',
    ltv: 'LTV数据',
    oneTime: '一次性用户',
  };
  return map[page] || page;
}

export function keepDetailsSubTitle(type: string | number, days?: number) {
  if (type === 'reg') return '注册人数详情';
  if (type === 'new') return '新增人数详情';
  if (type === 'pay') return '首存人数详情';
  if (type === 'once') return '一次性用户详情';
  if (type === 'oneTime') {
    return days && days > 7 ? '7次或以上用户详情' : `${days || ''}次用户详情`;
  }
  if (type === 'topUp') {
    return days === 0 ? '首日充值详情' : `${Number(days || 0) + 1}日充值详情`;
  }
  if (type === 2 || type === '2') return '次日详情';
  return `${type}日留存详情`;
}
