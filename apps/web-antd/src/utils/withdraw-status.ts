export const WITHDRAW_STATUS_OPTIONS = [
  { label: '待处理', value: 1 },
  { label: '已出款', value: 2 },
  { label: '退款驳回', value: 3 },
  { label: '处理中', value: 6 },
  { label: '不退款驳回', value: 4 },
  { label: '出款异常', value: 5 },
];

export function calcWithdrawStatusText(
  status?: number,
  process?: number,
  refundScore?: number,
) {
  if (status === 1 && process !== undefined && process <= 4) {
    return '待处理';
  }
  if (status === 1 && process === 6) {
    return '出款异常';
  }
  if ((status === 2 || status === 4) && process === 7) {
    return '已出款';
  }
  if (status === 3 && process === 8 && refundScore === 1) {
    return '退款驳回';
  }
  if (status === 3 && process === 8 && refundScore === 2) {
    return '不退款驳回';
  }
  if (status === 1 && process === 5) {
    return '待冲正';
  }
  return '处理中';
}

export function formatRiskStatus(status?: number) {
  switch (status) {
    case -1: {
      return '未处理';
    }
    case 1: {
      return '通过';
    }
    case 2: {
      return '不通过';
    }
    case 3: {
      return '挂起';
    }
    default: {
      return '-';
    }
  }
}

export function getRiskStatusColor(
  status?: number,
): 'default' | 'error' | 'success' | 'warning' {
  switch (status) {
    case 1: {
      return 'success';
    }
    case 2:
    case 3: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

export function formatReceivedStatus(status?: number) {
  switch (status) {
    case 1: {
      return '手动到账';
    }
    case 2: {
      return '自动到账';
    }
    case 3: {
      return '到账异常';
    }
    case 4: {
      return '异常已处理';
    }
    default: {
      return '未通知';
    }
  }
}

export function getReceivedStatusColor(
  status?: number,
): 'default' | 'error' | 'success' {
  switch (status) {
    case 1:
    case 2:
    case 4: {
      return 'success';
    }
    case 3: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

export const WITHDRAW_TIME_TYPE_OPTIONS = [
  { label: '申请时间', value: 1 },
  { label: '结束时间', value: 2 },
  { label: '风控时间', value: 3 },
];
