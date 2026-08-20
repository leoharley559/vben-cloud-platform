import type { TimeshareHourItem } from '#/types/promotion';

export const HOUR_LABELS = Array.from(
  { length: 24 },
  (_, hour) => `${hour}:00`,
);

export type TimeshareChartType = 'bar' | 'line' | 'table';

export type TimeshareMetricKey =
  | 'addDevice'
  | 'addExchangeMoney'
  | 'addExchangeNum'
  | 'addNumber'
  | 'addPayMoney'
  | 'addPayNum'
  | 'allLogin';

export const TIMESHARE_METRIC_MAP: Record<
  TimeshareMetricKey,
  { label: string; permission: number }
> = {
  addDevice: { label: '新增设备', permission: 10_880 },
  addExchangeMoney: { label: '新增兑换金额', permission: 10_884 },
  addExchangeNum: { label: '新增兑换人数', permission: 10_885 },
  addNumber: { label: '新增用户', permission: 10_878 },
  addPayMoney: { label: '付费金额', permission: 10_882 },
  addPayNum: { label: '付费人数', permission: 10_883 },
  allLogin: { label: '总登录', permission: 10_881 },
};

function sortDayGroups(data: TimeshareHourItem[][]) {
  return [...data]
    .filter((group) => Array.isArray(group) && group.length > 0)
    .toSorted((a, b) => {
      const aDay = a?.[0]?.ReportDay || '';
      const bDay = b?.[0]?.ReportDay || '';
      return new Date(bDay).getTime() - new Date(aDay).getTime();
    });
}

function keepDayGroups(data: TimeshareHourItem[][]) {
  return data.filter((group) => Array.isArray(group) && group.length > 0);
}

function getMetricValue(item: TimeshareHourItem, metric: TimeshareMetricKey) {
  switch (metric) {
    case 'addDevice': {
      return Number(item.SumDevice ?? 0);
    }
    case 'addExchangeMoney': {
      return Number(item.SumWithdrawMoney ?? 0) / 100;
    }
    case 'addExchangeNum': {
      return Number(item.SumWithdrawNum ?? 0);
    }
    case 'addNumber': {
      return Number(item.SumReg ?? 0);
    }
    case 'addPayMoney': {
      return (
        (Number(item.SumAgentPayMoney ?? 0) + Number(item.SumPayMoney ?? 0)) /
        100
      );
    }
    case 'addPayNum': {
      return Number(item.SumAgentPayNum ?? 0) + Number(item.SumPayNum ?? 0);
    }
    case 'allLogin': {
      return Number(item.SumLogin ?? 0);
    }
    default: {
      return 0;
    }
  }
}

/** 表格按接口返回日顺序；小时列对齐旧站 0–23 */
export function buildTimeshareTable(
  data: TimeshareHourItem[][],
  metric: TimeshareMetricKey,
) {
  const groups = keepDayGroups(data);
  const reportDays = groups.map((group) => group[0]?.ReportDay || '-');
  const rows = Array.from({ length: 24 }, (_, hour) => {
    const row: Record<string, number | string> = { hour };
    groups.forEach((group, index) => {
      const hourData = group.find((item) => Number(item.Hours) === hour);
      row[`day_${index}`] = hourData ? getMetricValue(hourData, metric) : '-';
    });
    return row;
  });
  return { reportDays, rows };
}

/** 图表按日期倒序，缺小时补 0，保证与 0:00–23:00 横轴对齐 */
export function buildTimeshareChart(
  data: TimeshareHourItem[][],
  metric: TimeshareMetricKey,
  chartType: Exclude<TimeshareChartType, 'table'>,
) {
  const groups = sortDayGroups(data);
  const legend = groups.map((group) => group[0]?.ReportDay || '-');
  const series = groups.map((group) => ({
    animationDuration: 1000,
    animationEasing: 'cubicInOut' as const,
    data: HOUR_LABELS.map((_, hourIndex) => {
      const hourData = group.find((item) => Number(item.Hours) === hourIndex);
      return hourData ? getMetricValue(hourData, metric) : 0;
    }),
    name: group[0]?.ReportDay || '-',
    smooth: false,
    type: chartType,
  }));
  return { legend, series, xAxis: HOUR_LABELS };
}

/** 跨 Tab 共享图例选中态（对齐旧站 vuex legendSeleced） */
export const timeshareLegendSelected: Record<string, boolean> = {};
