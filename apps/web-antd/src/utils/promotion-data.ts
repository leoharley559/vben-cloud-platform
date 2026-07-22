import BigNumber from 'bignumber.js';

export function calcPercent(numerator?: number, denominator?: number) {
  const num = Number(numerator || 0);
  const den = Number(denominator || 0);
  if (!den) {
    return '0.00%';
  }
  return `${((num / den) * 100).toFixed(2)}%`;
}

export function calcArppu(count?: number, money?: number) {
  const totalCount = Number(count || 0);
  const totalMoney = Number(money || 0);
  if (!totalCount) {
    return '0.00';
  }
  return (totalMoney / totalCount / 100).toFixed(2);
}

/** 分转元 + 汇率，固定两位小数（对齐旧站 RMBfilters） */
export function formatPromoteMoney(value?: number, rate = 1) {
  const amount = new BigNumber(Number(value || 0) * rate).dividedBy(100);
  return amount.isNaN() ? '0.00' : amount.toFormat(2);
}

export function getPayUserCount(row: {
  SumAgentPayNum?: number;
  SumPayMergerNum?: number;
  SumPayNum?: number | string;
}) {
  if (row.SumPayNum === '-') {
    return Number(row.SumPayMergerNum || 0);
  }
  return Number(row.SumPayNum || 0) + Number(row.SumAgentPayNum || 0);
}

export function getPayMoney(row: {
  SumAgentPayMoney?: number;
  SumPayMergerMoney?: number;
  SumPayMoney?: number;
}) {
  return Number(row.SumPayMoney || 0) + Number(row.SumAgentPayMoney || 0);
}

export function formatDateOnly(value?: string) {
  if (!value) {
    return '-';
  }
  return value.length > 10 ? value.slice(0, 10) : value;
}
