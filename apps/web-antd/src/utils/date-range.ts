import dayjs from 'dayjs';

/** 默认查询昨天整天（unix 秒，对齐旧系统 logsManage） */
export function getYesterdayRangeSeconds() {
  const yesterday = dayjs().subtract(1, 'day');
  return {
    BeginTime: yesterday.startOf('day').unix(),
    EndTime: yesterday.endOf('day').unix(),
  };
}

/** 玩家详情充提记录默认：近 7 天至昨天（unix 秒） */
export function getLast7DaysToYesterdayRangeSeconds() {
  return {
    BeginTime: dayjs().subtract(7, 'day').startOf('day').unix(),
    EndTime: dayjs().subtract(1, 'day').endOf('day').unix(),
  };
}

/** 玩家详情登录记录默认：当月（unix 秒） */
export function getCurrentMonthRangeSeconds() {
  return {
    BeginTime: dayjs().startOf('month').unix(),
    EndTime: dayjs().endOf('month').unix(),
  };
}

export function toUnixSeconds(value?: dayjs.ConfigType, endOfDay = false) {
  if (!value) {
    return undefined;
  }
  const date = dayjs(value);
  return endOfDay ? date.endOf('day').unix() : date.startOf('day').unix();
}
