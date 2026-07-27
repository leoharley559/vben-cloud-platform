/** 提款方式文案 */
export const PAY_TYPE_MAP: Record<number, string> = {
  1: '银行卡',
  2: '支付宝',
  3: 'USDT',
  4: '极速支付',
  204: '银行卡',
  206: '支付宝',
  209: 'USDT',
};

/** 筛选用提款方式（不含第三方映射码） */
export const PAY_TYPE_OPTIONS = [
  { label: '银行卡', value: 1 },
  { label: '支付宝', value: 2 },
  { label: 'USDT', value: 3 },
  { label: '极速支付', value: 4 },
];

export const MULTIPLY_OPTIONS = [-1, 0, 10, 50, 100, 500, 1000, 5000, 10_000].map(
  (value) => ({
    label:
      value === -1 ? '使用出款设置' : value === 0 ? '全部' : `${value}倍`,
    value,
  }),
);

export function payTypeLabel(value: unknown) {
  const key = Number(value);
  return PAY_TYPE_MAP[key] || String(value ?? '-');
}

/** 处理时长（秒 → HH:mm:ss） */
export function formatDuration(value: unknown) {
  const total = Number(value || 0);
  if (!total) return '-';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}

/** 提款订单状态文案 */
export function withdrawStatus(row: Record<string, unknown>) {
  const status = Number(row.Status);
  const process = Number(row.Process);
  const refund = Number(row.RefundScore);
  if (status === 1 && process <= 4) return '待处理';
  if (status === 1 && process === 5) return '待转回';
  if (status === 1 && process === 6) return '出款异常';
  if ([2, 4].includes(status) && process === 7) return '已出款';
  if (status === 3 && process === 8) {
    return refund === 1 ? '退款驳回' : '不退款驳回';
  }
  return '处理中';
}
