import BigNumber from 'bignumber.js';

/**
 * 金额格式化（对齐 cloudPlatform formatAmount）
 */
export function formatAmount(amount?: BigNumber.Value | null) {
  if (amount === undefined || amount === null || amount === '') {
    return '0';
  }
  const value = new BigNumber(amount);
  if (value.isNaN()) {
    return '0';
  }
  return value.toFormat();
}

/**
 * 分转元并格式化（后台金额常为分）
 */
export function formatAmountFromCent(amount?: BigNumber.Value | null) {
  if (amount === undefined || amount === null || amount === '') {
    return '0';
  }
  return formatAmount(new BigNumber(amount).dividedBy(100));
}
