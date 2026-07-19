export const GAME_TITLE_DISPLAY_DESC_MAP: Record<number, string> = {
  1: '游戏内显示称号条件',
  2: '游戏内显示描述',
};

export const GAME_TITLE_OWNER_STATUS_MAP: Record<number, string> = {
  1: '符合条件',
  2: '未领取',
  3: '已领取',
};

export function formatGameTitleDisplayDesc(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return GAME_TITLE_DISPLAY_DESC_MAP[value] || String(value);
}

export function formatGameTitleOwnerStatus(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return GAME_TITLE_OWNER_STATUS_MAP[value] || String(value);
}

export function formatGameTitleOwnerStatusClass(value?: number) {
  switch (value) {
    case 1: {
      return 'text-blue-600';
    }
    case 2: {
      return 'text-orange-500';
    }
    case 3: {
      return 'text-green-600';
    }
    default: {
      return '';
    }
  }
}

export function formatGameTitleBudget(value?: number) {
  if (value === 0) {
    return '全部';
  }
  return value === undefined || value === null ? '-' : String(value);
}

export function formatGameTitleVip(row: { Type?: number; Vip?: number }) {
  if (row.Type === 1 && row.Vip !== undefined && row.Vip !== null) {
    return `VIP${row.Vip} 以上`;
  }
  return '-';
}

export function formatGameTitleActiveTime(
  start?: number,
  end?: number,
  formatDate: (value?: number) => string = String,
) {
  if (start === 0 && end === 0) {
    return '长期开放';
  }
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}
