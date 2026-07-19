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

export function formatPlayerStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return PLAYER_STATUS_MAP[Number(status)] || String(status);
}

export function formatMemberType(dataFlag?: number | string) {
  if (dataFlag === undefined || dataFlag === null || dataFlag === '') {
    return '-';
  }
  return Number(dataFlag) ? '测试' : '正式';
}
