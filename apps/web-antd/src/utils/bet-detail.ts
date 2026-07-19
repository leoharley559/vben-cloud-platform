export const BET_STATUS_OPTIONS = [
  { label: '未结算', value: '-1' },
  { label: '已结算', value: '1' },
  { label: '已取消', value: '2' },
];

export const BET_TIME_TYPE_OPTIONS = [
  { label: '投注时间', value: 1 },
  { label: '结算时间', value: 2 },
];

export const BET_YES_NO_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '是', value: 1 },
];

const BET_STATUS_MAP: Record<string, string> = {
  '-1': '未结算',
  '1': '已结算',
  '2': '已取消',
};

export function formatBetStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return BET_STATUS_MAP[String(status)] || String(status);
}

/** 汇总输赢：返奖 - 下注 */
export function calcBetWinLoss(
  status?: number | string,
  winGold?: number | string,
  betGold?: number | string,
) {
  if (Number(status) !== 1) {
    return 0;
  }
  return Number(winGold || 0) - Number(betGold || 0);
}

/**
 * 列表「输赢情况」单元格：对齐旧站，已结算直接显示返奖金额 WinGold（非 Win-Bet）
 */
export function calcBetWinLossCell(
  status?: number | string,
  winGold?: number | string,
) {
  if (Number(status) !== 1) {
    return 0;
  }
  return Number(winGold || 0);
}

/** 下注金额单元格：取消单用 TotalBetGold，其余用 BetGold */
export function pickBetAmount(
  status?: number | string,
  totalBetGold?: number | string,
  betGold?: number | string,
) {
  return Number(status) === 2
    ? Number(totalBetGold || 0)
    : Number(betGold || 0);
}

export const BET_SETTLE_LOG_TYPE_MAP: Record<string, string> = {
  '0': '未定义',
  '1': '投注',
  '2': '打赏',
  '3': '转账',
  '4': '取消返水',
  '11': '结算',
  '12': '取消投注',
  '13': '中奖池',
  '14': '转出',
  '15': '红利',
  '16': '返水',
  '17': '提前结算',
  '21': '二次结算',
};

export function formatBetSettleLogType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return BET_SETTLE_LOG_TYPE_MAP[String(type)] || String(type);
}

export const MAX_BET_QUERY_RANGE_SECONDS = 2_678_399;
