export type DailyReportRow = Record<string, unknown>;

/** 对齐旧站 everydayData/everydayData.js calcData */
export function calcDailyReportRow(el: DailyReportRow | null | undefined) {
  if (!el) {
    return el;
  }

  const sumReg = Number(el.SumReg || 0);
  const sumFirstPayNum = Number(el.SumFirstPayNum || 0);
  const sumFirstPayMoney = Number(el.SumFirstPayMoney || 0);
  const sumTransBetNum1 = Number(el.SumTransBetNum1 || 0);
  const sumTransBetMoney1 = Number(el.SumTransBetMoney1 || 0);
  const sumPayMergerMoney = Number(el.SumPayMergerMoney || 0);
  const sumWithdrawMoney = Number(el.SumWithdrawMoney || 0);
  const sumAccountChangeSumNum = Number(el.SumAccountChangeSumNum || 0);
  const sumRedSumNum = Number(el.SumRedSumNum || 0);
  const sumBetWaterMoney = Number(el.SumBetWaterMoney || 0);
  const sumAgentCommissionSumNum = Number(el.SumAgentCommissionSumNum || 0);
  const sumTransWinMoney1 = Number(el.SumTransWinMoney1 || 0);
  const sumPayMergerNum = Number(el.SumPayMergerNum || 0);

  el.PercentConversion = (
    sumReg === 0 ? 0 : (sumFirstPayNum / sumReg) * 100
  ).toFixed(2);
  el.AverageFirstPayMoney =
    sumFirstPayNum === 0 ? 0 : sumFirstPayMoney / sumFirstPayNum;
  el.AverageTransBetMoney =
    sumTransBetNum1 === 0 ? 0 : sumTransBetMoney1 / sumTransBetNum1;
  el.DiffPayWithdrawMoney = sumPayMergerMoney - sumWithdrawMoney;
  el.PercentPayWithdraw = (
    sumPayMergerMoney === 0 ? 0 : (sumWithdrawMoney / sumPayMergerMoney) * 100
  ).toFixed(2);
  el.CompanyProfitMoney = sumTransBetMoney1 - sumTransWinMoney1;
  el.PercentProfit = (
    sumTransBetMoney1 === 0
      ? 0
      : (Number(el.CompanyProfitMoney) / sumTransBetMoney1) * 100
  ).toFixed(2);
  el.CompanyIncomeMoney =
    Number(el.CompanyProfitMoney) -
    sumAccountChangeSumNum -
    sumRedSumNum -
    sumBetWaterMoney -
    sumAgentCommissionSumNum;
  el.Arppu = (
    sumPayMergerNum === 0 ? 0 : sumPayMergerMoney / sumPayMergerNum / 100
  ).toFixed(0);

  return el;
}

export function calcDailyReportRows(rows: DailyReportRow[]) {
  return rows.map((row) => calcDailyReportRow({ ...row }) as DailyReportRow);
}
