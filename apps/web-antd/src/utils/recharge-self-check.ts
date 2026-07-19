export const SELF_CHECK_STATUS_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '申请中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '拒绝', value: 3 },
  { label: '审核中', value: 4 },
];

export const SELF_CHECK_STATUS_MAP: Record<number, string> = {
  1: '申请中',
  2: '已完成',
  3: '拒绝',
  4: '审核中',
};

export function formatSelfCheckStatus(status?: number) {
  if (status === undefined || status === null) {
    return '-';
  }
  return SELF_CHECK_STATUS_MAP[status] || String(status);
}

export function getSelfCheckStatusColor(status?: number) {
  if (Number(status) === 2) {
    return 'success';
  }
  if (Number(status) === 3) {
    return 'error';
  }
  if (Number(status) === 4) {
    return 'warning';
  }
  if (Number(status) === 1) {
    return 'processing';
  }
  return 'default';
}
