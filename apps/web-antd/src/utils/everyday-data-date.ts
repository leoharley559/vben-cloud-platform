import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

/** 当月第一天 YYYY-MM-DD（对齐旧站 GLOBAL.defaultDate） */
export function defaultReportBeginTime() {
  return dayjs().startOf('month').format('YYYY-MM-DD');
}

/** 今天 YYYY-MM-DD（对齐旧站 getBeforeDateStr(1, false, false)） */
export function defaultReportEndTime() {
  return dayjs().format('YYYY-MM-DD');
}

export function defaultDailyReportRange(): [string, string] {
  return [defaultReportBeginTime(), defaultReportEndTime()];
}

/** 月报默认区间：约 90 天前月份 ~ 当月 */
export function defaultMonthlyReportRange(): [string, string] {
  return [
    dayjs().subtract(89, 'day').format('YYYY-MM'),
    dayjs().format('YYYY-MM'),
  ];
}

/** 周报默认区间：本周一至周日 */
export function defaultWeeklyReportRange(): [string, string] {
  const base = dayjs();
  const weekday = base.day();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const start = base.add(diffToMonday, 'day');
  const end = start.add(6, 'day');
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
}

export function formatWeekReportDay(date: string) {
  if (date === '2024-53') {
    date = '2025-0';
  }
  const [year, week] = date.split('-');
  let weekNum = Number(week);
  if (year === '2025') {
    weekNum += 1;
  }
  return `${year}年第${weekNum}周`;
}

export function toDateStrings(
  range: [Dayjs, Dayjs] | undefined,
  format: string,
) {
  if (!range?.[0] || !range?.[1]) {
    return { beginTime: '', endTime: '' };
  }
  return {
    beginTime: range[0].format(format),
    endTime: range[1].format(format),
  };
}
