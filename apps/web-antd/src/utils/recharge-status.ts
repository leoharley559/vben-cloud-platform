const RECHARGE_STATUS_MAP: Record<number, string> = {
  1: '处理中',
  2: '充值成功',
  3: '充值失败',
  4: '已审核',
  5: '人工充值',
  10: '上传图片',
  11: '已审核',
  12: '充值取消',
  13: '用户取消',
};

export const RECHARGE_STATUS_OPTIONS = Object.entries(RECHARGE_STATUS_MAP).map(
  ([value, label]) => ({
    label,
    value: Number(value),
  }),
);

export function formatRechargeStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return RECHARGE_STATUS_MAP[Number(status)] || String(status);
}

export function getRechargeStatusColor(
  status?: number | string,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  switch (Number(status)) {
    case 1:
      return 'warning';
    case 2:
      return 'success';
    case 3:
      return 'error';
    case 4:
    case 5:
    case 11:
      return 'processing';
  }
  return 'default';
}

const HANDLE_TYPE_MAP: Record<number, string> = {
  1: '自动',
  2: '补单',
  3: '空单',
  4: '人工充值',
};

export function formatRechargeHandleType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return HANDLE_TYPE_MAP[Number(type)] || String(type);
}
