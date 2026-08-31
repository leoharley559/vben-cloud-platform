const PLAYER_STATUS_MAP: Record<number, string> = {
  0: '正常',
  1: '优质',
  2: '关注',
  3: '封号',
  4: '禁提',
  6: '暂封',
  8: '测试',
};

export const PLAYER_STATUS_OPTIONS = Object.entries(PLAYER_STATUS_MAP).map(
  ([value, label]) => ({
    label,
    value: Number(value),
  }),
);

export function formatPlayerStatus(status?: null | number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return PLAYER_STATUS_MAP[Number(status)] || String(status);
}

/**
 * 对齐旧站 showStatusTag：
 * 0 正常无色 / 1 优质 success / 2 关注 danger→error /
 * 3、6 封号暂封 info→default / 4 禁提 warning / 8 测试 processing
 */
export function playerStatusTagColor(
  status?: null | number | string,
): string | undefined {
  switch (Number(status)) {
    case 1: {
      return 'success';
    }
    case 2: {
      return 'error';
    }
    case 3:
    case 6: {
      return 'default';
    }
    case 4: {
      return 'warning';
    }
    case 8: {
      return 'processing';
    }
    default: {
      return undefined;
    }
  }
}

export function formatMemberType(dataFlag?: number | string) {
  if (dataFlag === undefined || dataFlag === null || dataFlag === '') {
    return '-';
  }
  return Number(dataFlag) ? '测试' : '正式';
}

/** 注册方式（对齐旧站 accountTypeFilter） */
const ACCOUNT_TYPE_MAP: Record<number, string> = {
  0: 'Facebook',
  1: 'Google',
  2: 'Telegram',
  3: '账号注册',
  4: '手机号注册',
  5: '邮箱注册',
  6: 'Maya注册',
  99: '-',
};

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_MAP)
  .filter(([value]) => Number(value) !== 99)
  .map(([value, label]) => ({
    label,
    value: Number(value),
  }));

export function formatAccountType(accountType?: null | number | string) {
  if (
    accountType === undefined ||
    accountType === null ||
    accountType === ''
  ) {
    return '=';
  }
  const num = Number(accountType);
  if (Number.isNaN(num)) {
    return String(accountType);
  }
  return ACCOUNT_TYPE_MAP[num] ?? '=';
}
