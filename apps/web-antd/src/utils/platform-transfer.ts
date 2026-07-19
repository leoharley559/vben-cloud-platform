export function formatPlatformTransferState(state?: number | string) {
  switch (Number(state)) {
    case -1:
      return '处理中';
    case 0:
      return '成功';
    case 5:
    case 17:
      return '转人工处理';
    default:
      return '失败';
  }
}

export function getPlatformTransferStateColor(state?: number | string) {
  switch (Number(state)) {
    case -1:
      return 'warning';
    case 0:
      return 'success';
    case 5:
    case 17:
      return 'processing';
    default:
      return 'error';
  }
}

export function formatMatchAuditStatus(status?: number | string) {
  switch (Number(status)) {
    case 1:
      return '待审核';
    case 2:
      return '已通过';
    case 3:
      return '已拒绝';
    default:
      return String(status ?? '-');
  }
}

export function getMatchAuditStatusColor(status?: number | string) {
  switch (Number(status)) {
    case 1:
      return 'warning';
    case 2:
      return 'success';
    case 3:
      return 'error';
    default:
      return 'default';
  }
}
