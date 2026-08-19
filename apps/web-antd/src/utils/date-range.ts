import dayjs from 'dayjs';

/** 默认查询昨天整天（unix 秒） */
export function getYesterdayRangeSeconds() {
  const yesterday = dayjs().subtract(1, 'day');
  return {
    BeginTime: yesterday.startOf('day').unix(),
    EndTime: yesterday.endOf('day').unix(),
  };
}

/**
 * 默认查询今天整天（unix 秒）。
 * 对齐旧站 logsManage：`getBeforeDateTimestamp(1, false)` ～ `getBeforeDateTimestamp()`
 * （内部 days-1 → 今天 00:00:00 ～ 今天 23:59:59）。
 */
export function getTodayRangeSeconds() {
  return {
    BeginTime: dayjs().startOf('day').unix(),
    EndTime: dayjs().endOf('day').unix(),
  };
}

/**
 * 游戏记录默认：昨天 00:00:00 ～ 今天 23:59:59（unix 秒）。
 * 对齐旧站 `getBeforeDateTimestamp(2, false)` ～ `getBeforeDateTimestamp(1)`。
 */
export function getYesterdayToTodayRangeSeconds() {
  return {
    BeginTime: dayjs().subtract(1, 'day').startOf('day').unix(),
    EndTime: dayjs().endOf('day').unix(),
  };
}

/** 玩家详情充提记录默认：近 7 天至昨天（unix 秒） */
export function getLast7DaysToYesterdayRangeSeconds() {
  return {
    BeginTime: dayjs().subtract(7, 'day').startOf('day').unix(),
    EndTime: dayjs().subtract(1, 'day').endOf('day').unix(),
  };
}

/**
 * 资金流默认：近 7 个自然日（含今天）（unix 秒）。
 * 对齐旧站 `getBeforeDateTimestamp(7)` ～ `getBeforeDateTimestamp()`
 * （内部 days-1 → 今天−6 日 00:00 ～ 今天 23:59:59）。
 */
export function getLast7CalendarDaysRangeSeconds() {
  return {
    BeginTime: dayjs().subtract(6, 'day').startOf('day').unix(),
    EndTime: dayjs().endOf('day').unix(),
  };
}

/**
 * 默认查询近 3 个自然日（含今天）（unix 秒）。
 * 对齐旧站 `getBeforeDateTimestamp(3)` ～ `getBeforeDateTimestamp()`
 * （内部 days-1 → 今天−2 日 00:00 ～ 今天 23:59:59）。
 */
export function getLast3CalendarDaysRangeSeconds() {
  return {
    BeginTime: dayjs().subtract(2, 'day').startOf('day').unix(),
    EndTime: dayjs().endOf('day').unix(),
  };
}

/** 当月：月初 00:00:00 至今天 23:59:59（不含未来日期） */
export function getCurrentMonthRangeSeconds() {
  return {
    BeginTime: dayjs().startOf('month').unix(),
    EndTime: dayjs().endOf('day').unix(),
  };
}

export function toUnixSeconds(value?: dayjs.ConfigType, endOfDay = false) {
  if (!value) {
    return undefined;
  }
  const date = dayjs(value);
  return endOfDay ? date.endOf('day').unix() : date.startOf('day').unix();
}
