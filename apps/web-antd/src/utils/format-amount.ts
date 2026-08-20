import BigNumber from 'bignumber.js';

/**
 * 金额格式化（对齐 cloudPlatform formatAmount / toThousandFilter）
 * @param amount 元
 * @param digits 小数位数，默认 2
 */
export function formatAmount(amount?: BigNumber.Value | null, digits = 2) {
  if (amount === undefined || amount === null || amount === '') {
    return (0).toFixed(digits);
  }
  const value = new BigNumber(amount);
  if (value.isNaN() || value.isZero()) {
    // 避免 -0 / -0.00（对 0 取反后再格式化会出现）
    return (0).toFixed(digits);
  }
  return value.toFormat(digits, BigNumber.ROUND_HALF_UP);
}

/**
 * 分转元并格式化（后台金额常为分）
 * 对齐旧站 RMBfilters 默认 digits=2：`(value / 100).toFixed(2)` + 千分位
 * @param amount 分
 * @param digits 小数位数，默认 2；传 0 可对齐旧站 RMBfilters(0) 取整
 */
export function formatAmountFromCent(
  amount?: BigNumber.Value | null,
  digits = 2,
) {
  if (amount === undefined || amount === null || amount === '') {
    return (0).toFixed(digits);
  }
  const value = new BigNumber(amount).dividedBy(100);
  if (value.isNaN()) {
    return (0).toFixed(digits);
  }
  return formatAmount(value, digits);
}
