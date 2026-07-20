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
  addExchangeMoney: { label: '兑换金额', permission: 10_884 },
  addExchangeNum: { label: '兑换人数', permission: 10_885 },
  addNumber: { label: '新增用户', permission: 10_878 },
  addPayMoney: { label: '付费金额', permission: 10_882 },
  addPayNum: { label: '付费人数', permission: 10_883 },
  allLogin: { label: '总登录', permission: 10_881 },
};

function sortDayGroups(data: TimeshareHourItem[][]) {
  return data.filter((group) => Array.isArray(group) && group.length > 0).toSorted((a, b) => {
    const aDay = a?.[0]?.ReportDay || '';
    const bDay = b?.[0]?.ReportDay || '';
    return new Date(bDay).getTime() - new Date(aDay).getTime();
  });
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
        (Number(item.SumAgentPayMoney ?? 0) +
          Number(item.SumPayMoney ?? 0)) /
        100
      );
    }
    case 'addPayNum': {
      return (
        Number(item.SumAgentPayNum ?? 0) + Number(item.SumPayNum ?? 0)
      );
    }
    case 'allLogin': {
      return Number(item.SumLogin ?? 0);
    }
    default: {
      return 0;
    }
  }
}

export function buildTimeshareTable(
  data: TimeshareHourItem[][],
  metric: TimeshareMetricKey,
) {
  const groups = sortDayGroups(data);
  const reportDays = groups.map((group) => group[0]?.ReportDay || '-');
  const rows = HOUR_LABELS.map((hour, hourIndex) => {
    const row: Record<string, number | string> = { hour };
    groups.forEach((group, index) => {
      const hourData = group.find((item) => Number(item.Hours) === hourIndex);
      row[`day_${index}`] = hourData ? getMetricValue(hourData, metric) : '-';
    });
    return row;
  });
  return { reportDays, rows };
}

export function buildTimeshareChart(
  data: TimeshareHourItem[][],
  metric: TimeshareMetricKey,
  chartType: Exclude<TimeshareChartType, 'table'>,
) {
  const groups = sortDayGroups(data);
  const legend = groups.map((group) => group[0]?.ReportDay || '-');
  const series = groups.map((group) => ({
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
