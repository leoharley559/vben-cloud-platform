export type ChannelRow = Record<string, unknown>;
export type ChannelDim = 'agent' | 'channel';

/**
 * 对齐旧站 TodayAgentData / TodayChannelData 计算列。
 * 注意：渠道维度账户调整不取反，公司收入对账户调整符号也与代理相反。
 */
export function calcChannelRow(row: ChannelRow, dim: ChannelDim): ChannelRow {
  const next = { ...row };
  const sumReg = Number(next.SumReg || 0);
  const sumFirstPayNum = Number(next.SumFirstPayNum || 0);
  const sumFirstPayMoney = Number(next.SumFirstPayMoney || 0);
  const sumPayMergerMoney = Number(next.SumPayMergerMoney || 0);
  const sumWithdrawMoney = Number(next.SumWithdrawMoney || 0);
  const sumTransBetMoney1 = Number(next.SumTransBetMoney1 || 0);
  const sumTransWinMoney1 = Number(next.SumTransWinMoney1 || 0);
  const sumAccountChange = Number(next.SumAccountChangeSumNum || 0);
  const sumRed = Number(next.SumRedSumNum || 0);
  const sumWater = Number(next.SumBetWaterMoney || 0);
  const sumCommission = Number(next.SumAgentCommissionSumNum || 0);

  next.PercentConversion = (
    sumReg === 0 ? 0 : (sumFirstPayNum / sumReg) * 100
  ).toFixed(2);
  next.AverageFirstPayMoney =
    sumFirstPayNum === 0 ? 0 : Math.round(sumFirstPayMoney / sumFirstPayNum);
  next.DiffPayWithdrawMoney = sumPayMergerMoney - sumWithdrawMoney;
  next.PercentPayWithdraw = (
    sumPayMergerMoney === 0 ? 0 : (sumWithdrawMoney / sumPayMergerMoney) * 100
  ).toFixed(2);
  // 公司输赢 = -派送金额（对齐 everydayData / 旧站 table.vue）
  next.CompanyProfitMoney = -sumTransWinMoney1;
  next.PercentProfit = (
    sumTransBetMoney1 === 0
      ? 0
      : (Number(next.CompanyProfitMoney) / sumTransBetMoney1) * 100
  ).toFixed(2);

  // 账户调整展示值
  next.AccountAdjustDisplay =
    dim === 'agent' ? -sumAccountChange : sumAccountChange;

  // 公司收入（apiFee ± 抵消）
  next.CompanyIncomeMoney =
    Number(next.CompanyProfitMoney) +
    (dim === 'agent' ? -sumAccountChange : sumAccountChange) -
    sumRed -
    sumWater -
    sumCommission;

  return next;
}

export function calcChannelRows(rows: ChannelRow[], dim: ChannelDim) {
  return rows.map((row) => calcChannelRow(row, dim));
}
