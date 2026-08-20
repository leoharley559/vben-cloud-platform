import type { Dayjs } from 'dayjs';

import type { CloudProjectConfig } from '#/types/cloud-platform';

import dayjs from 'dayjs';

export interface ProjectConfigOption {
  Name: string;
  Value: number | string;
}

/** 对齐旧站 monthRangeDate limit-number：选中一端后限制另一端跨度 */
export function createRangeDayLimiter(maxDays: number) {
  let selecting: Dayjs | undefined;

  function disabledDate(current: Dayjs) {
    if (!selecting) {
      return false;
    }
    const min = selecting.subtract(maxDays, 'day');
    const max = selecting.add(maxDays, 'day');
    return current.isBefore(min, 'day') || current.isAfter(max, 'day');
  }

  function onCalendarChange(dates: [Dayjs, Dayjs] | [string, string] | null) {
    const first = dates?.[0];
    selecting = first
      ? (dayjs.isDayjs(first)
        ? first
        : dayjs(first))
      : undefined;
  }

  function clearSelecting() {
    selecting = undefined;
  }

  /** 已选区间是否超过 maxDays（含起止共 maxDays+1 天时按旧站 secondNum=maxDays*86400000 卡控） */
  function isRangeTooLong(range?: [Dayjs, Dayjs] | null) {
    if (!range?.[0] || !range?.[1]) {
      return false;
    }
    return (
      range[1].startOf('day').diff(range[0].startOf('day'), 'day') > maxDays
    );
  }

  return { clearSelecting, disabledDate, isRangeTooLong, onCalendarChange };
}

/** 从 ProjectConfig 数组按 Key 解析 JSON 下拉 */
export function parseProjectConfigOptions(
  projectConfig: CloudProjectConfig | null | undefined,
  key: string,
): ProjectConfigOption[] {
  const list = (projectConfig as null | Record<string, unknown> | undefined)
    ?.ProjectConfig;
  if (!Array.isArray(list)) {
    return [];
  }
  const hit = list.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item as { Key?: string }).Key === key,
  ) as undefined | { ValueString?: string };
  if (!hit?.ValueString) {
    return [];
  }
  try {
    const parsed = JSON.parse(hit.ValueString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatVisitSource(raw: unknown) {
  if (raw === undefined || raw === null || raw === '') {
    return '-';
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { source?: string };
      return parsed?.source || raw;
    } catch {
      return raw;
    }
  }
  return String(raw);
}

export function formatVisitDurationSeconds(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '-';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().slice(11, 19);
}

export function keepTwoDecimal(value: number) {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function percentOf(part: number, total: number) {
  if (!total) {
    return '0.00';
  }
  return keepTwoDecimal((part * 100) / total);
}

export function resolveAppTypeLabel(
  appType: unknown,
  deviceOptions: ProjectConfigOption[],
) {
  const key = String(appType ?? '');
  const hit = deviceOptions.find((item) => String(item.Value) === key);
  return hit?.Name || key || '-';
}
