import type { CsvColumn } from '#/utils/export-csv';
import type { DailyReportRow } from '#/utils/everyday-data-calc';
import { formatAmountFromCent } from '#/utils/format-amount';
import { useCloudPlatformStore } from '#/store/cloud-platform';

export function formatDevicePlatform(value: unknown) {
  const cloudStore = useCloudPlatformStore();
  const map = cloudStore.projectConfig?.DevicePlatformAll || {};
  const key = String(value ?? '');
  return map[key] || key || '-';
}

export function formatVipLevel(value: unknown) {
  const cloudStore = useCloudPlatformStore();
  const list = (cloudStore.projectConfig?.VIPLevelMap || []) as Array<{
    Level?: number | string;
    Name?: string;
  }>;
  const key = String(value ?? '');
  const hit = list.find((item) => String(item.Level) === key);
  return hit?.Name || key || '-';
}

export function normalizeSearchValue(
  value: Array<number | string> | number | string | undefined,
  searchType: number,
) {
  if (searchType === 0 && Array.isArray(value)) {
    return value.join(',');
  }
  return value ?? '';
}

export function joinMultiValue(
  value: Array<number | string> | number | string | undefined,
) {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value ?? '';
}

function exportMoney(value: unknown) {
  return formatAmountFromCent(Number(value || 0));
}

function exportPercent(value: unknown) {
  return value == null || value === '' ? '0%' : `${value}%`;
}

/** 上架包/设备日报导出列（含注册首存等） */
export function buildPackageStyleExportColumns(
  incomeHeader = '推广收入',
): CsvColumn<DailyReportRow>[] {
  return [
    { header: '日期', value: (row) => String(row.ReportDay || '') },
    { header: '新增访问', value: (row) => Number(row.SumDevice || 0) },
    { header: '注册账号', value: (row) => Number(row.SumReg || 0) },
    { header: '首存人数', value: (row) => Number(row.SumFirstPayNum || 0) },
    {
      header: '转化率(%)',
      value: (row) => exportPercent(row.PercentConversion),
    },
    {
      header: '首存金额(元)',
      value: (row) => exportMoney(row.SumFirstPayMoney),
    },
    {
      header: '人均首存(元)',
      value: (row) => exportMoney(row.AverageFirstPayMoney),
    },
    { header: '登录账户', value: (row) => Number(row.SumLogin || 0) },
    { header: '存款人数', value: (row) => Number(row.SumPayMergerNum || 0) },
    { header: '取款人数', value: (row) => Number(row.SumWithdrawNum || 0) },
    {
      header: '存款金额(元)',
      value: (row) => exportMoney(row.SumPayMergerMoney),
    },
    {
      header: '取款金额(元)',
      value: (row) => exportMoney(row.SumWithdrawMoney),
    },
    {
      header: '存提差(元)',
      value: (row) => exportMoney(row.DiffPayWithdrawMoney),
    },
    {
      header: '提存率(%)',
      value: (row) => exportPercent(row.PercentPayWithdraw),
    },
    { header: '投注人数', value: (row) => Number(row.SumTransBetNum1 || 0) },
    {
      header: '投注金额(元)',
      value: (row) => exportMoney(row.SumTransBetMoney1),
    },
    {
      header: '有效投注额(元)',
      value: (row) => exportMoney(row.SumTransBetValidMoney1),
    },
    {
      header: '派送金额(元)',
      value: (row) => exportMoney(row.SumTransWinMoney1),
    },
    {
      header: '公司输赢',
      value: (row) => exportMoney(row.CompanyProfitMoney),
    },
    {
      header: '盈余比例(%)',
      value: (row) => exportPercent(row.PercentProfit),
    },
    {
      header: '账户调整',
      value: (row) => exportMoney(-Number(row.SumAccountChangeSumNum || 0)),
    },
    {
      header: '红利',
      value: (row) => exportMoney(row.SumRedSumNum),
    },
    {
      header: '返水',
      value: (row) => exportMoney(row.SumBetWaterMoney),
    },
    {
      header: incomeHeader,
      value: (row) => exportMoney(row.CompanyIncomeMoney),
    },
  ];
}

/** 设备日报导出列 */
export function buildDeviceExportColumns(): CsvColumn<DailyReportRow>[] {
  return [
    { header: '日期', value: (row) => String(row.ReportDay || '') },
    {
      header: '设备类型',
      value: (row) => formatDevicePlatform(row.DevicePlatform),
    },
    ...buildPackageStyleExportColumns('推广收入').slice(1),
  ];
}

/** VIP日报导出列 */
export function buildVipExportColumns(): CsvColumn<DailyReportRow>[] {
  return [
    { header: '日期', value: (row) => String(row.ReportDay || '') },
    {
      header: 'VIP等级',
      value: (row) => formatVipLevel(row.VIPLevel),
    },
    { header: '登录账户', value: (row) => Number(row.SumLogin || 0) },
    { header: '存款人数', value: (row) => Number(row.SumPayMergerNum || 0) },
    { header: '取款人数', value: (row) => Number(row.SumWithdrawNum || 0) },
    {
      header: '存款金额(元)',
      value: (row) => exportMoney(row.SumPayMergerMoney),
    },
    {
      header: '取款金额(元)',
      value: (row) => exportMoney(row.SumWithdrawMoney),
    },
    {
      header: '存提差(元)',
      value: (row) => exportMoney(row.DiffPayWithdrawMoney),
    },
    {
      header: '提存率(%)',
      value: (row) => exportPercent(row.PercentPayWithdraw),
    },
    { header: '投注人数', value: (row) => Number(row.SumTransBetNum1 || 0) },
    {
      header: '投注金额(元)',
      value: (row) => exportMoney(row.SumTransBetMoney1),
    },
    {
      header: '有效投注额(元)',
      value: (row) => exportMoney(row.SumTransBetValidMoney1),
    },
    {
      header: '派送金额(元)',
      value: (row) => exportMoney(row.SumTransWinMoney1),
    },
    {
      header: '公司输赢',
      value: (row) => exportMoney(row.CompanyProfitMoney),
    },
    {
      header: '盈余比例(%)',
      value: (row) => exportPercent(row.PercentProfit),
    },
    {
      header: '账户调整',
      value: (row) => exportMoney(-Number(row.SumAccountChangeSumNum || 0)),
    },
    {
      header: '红利',
      value: (row) => exportMoney(row.SumRedSumNum),
    },
    {
      header: '返水',
      value: (row) => exportMoney(row.SumBetWaterMoney),
    },
    {
      header: '推广收入',
      value: (row) => exportMoney(row.CompanyIncomeMoney),
    },
  ];
}
