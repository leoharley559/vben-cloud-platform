export const VENUE_TRANSFER_STATE_MAP: Record<number, string> = {
  [-2]: '全部',
  [-1]: '进行中',
  0: '成功',
  1: '失败',
  2: '异常',
};

export const REBATE_AWARD_STATUS_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '待领取', value: 0 },
  { label: '成功', value: 1 },
  { label: '失败', value: 2 },
];

export const REBATE_AWARD_STATUS_MAP: Record<number, string> = {
  0: '待领取',
  1: '成功',
  2: '失败',
};

export const REBATE_AWARD_TYPE_MAP: Record<number, string> = {
  0: '自动',
  1: '手动',
};

export const CREDIT_WALLET_TYPE_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '佣金代存', value: 1 },
  { label: '额度代存', value: 2 },
  { label: '代客充值', value: 3 },
];

export const CREDIT_WALLET_TYPE_MAP: Record<number, string> = {
  1: '佣金代存',
  2: '额度代存',
  3: '代客充值',
};

export const CREDIT_STATUS_MAP: Record<number, string> = {
  2: '成功',
  3: '拒绝',
};

export const EASY_RECHARGE_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '进行中', value: 1 },
  { label: '已充值', value: 2 },
  { label: '拒绝', value: 3 },
];

export const EASY_RECHARGE_STATUS_MAP: Record<number, string> = {
  1: '进行中',
  2: '已充值',
  3: '拒绝',
};

export const WITHDRAW_WATER_TYPE_OPTIONS = [
  { label: '全部场馆', value: 0 },
  { label: '指定场馆类型', value: 1 },
  { label: '指定场馆', value: 2 },
];

export function formatCreditWalletType(type?: number) {
  if (type === undefined || type === null) {
    return '-';
  }
  return CREDIT_WALLET_TYPE_MAP[type] || String(type);
}

export function formatCreditStatus(status?: number) {
  if (status === undefined || status === null) {
    return '-';
  }
  return CREDIT_STATUS_MAP[status] || String(status);
}

export function getCreditStatusColor(status?: number) {
  if (Number(status) === 2) {
    return 'success';
  }
  if (Number(status) === 3) {
    return 'error';
  }
  return 'default';
}

export function formatEasyRechargeStatus(status?: number) {
  if (status === undefined || status === null) {
    return '-';
  }
  return EASY_RECHARGE_STATUS_MAP[status] || String(status);
}

export function getEasyRechargeStatusColor(status?: number) {
  if (Number(status) === 2) {
    return 'success';
  }
  if (Number(status) === 3) {
    return 'error';
  }
  if (Number(status) === 1) {
    return 'processing';
  }
  return 'default';
}

export function formatStreamingBillSubType(
  billType?: number,
  billSubType?: number,
) {
  if (!billType || !billSubType) {
    return '-';
  }
  const map: Record<number, Record<number, string>> = {
    1: { 1: '充值', 2: '快捷充值', 3: '代存' },
    2: { 1: '提现' },
    3: { 1: '投注', 2: '注单取消' },
    4: {
      3: '平台红利',
      4: '升级红利',
      5: '每月红包',
      6: '生日礼金',
      7: '代理红利',
      8: '推广红利',
      9: '存款优惠',
      10: '活动红利',
    },
    5: { 1: '手动发放', 2: '系统发放' },
    6: { 1: '系统调整', 2: '输赢调整', 3: '充值调整' },
    7: { 1: '手动调整', 2: '系统调整' },
  };
  return map[billType]?.[billSubType] || String(billSubType);
}

export function formatStreamingBillType(type?: number) {
  if (type === undefined || type === null) {
    return '-';
  }
  const option = STREAMING_BILL_TYPE_OPTIONS.find(
    (item) => item.value === Number(type),
  );
  return option?.label || String(type);
}

export const STREAMING_BILL_TYPE_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '充值', value: 1 },
  { label: '提现', value: 2 },
  { label: '投注', value: 3 },
  { label: '红利', value: 4 },
  { label: '返水', value: 5 },
  { label: '调整', value: 6 },
  { label: '流水调整', value: 7 },
];

export const POINT_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '红利发放', value: 1 },
  { label: '积分商城', value: 2 },
  { label: '积分返水', value: 3 },
  { label: '积分调整', value: 4 },
  { label: 'N级代理', value: 5 },
];

export const POINT_TYPE_MAP: Record<number, string> = {
  1: '红利发放',
  2: '积分商城',
  3: '积分返水',
  4: '积分调整',
  5: 'N级代理',
};

export const RISK_WARN_LEVEL_MAP: Record<number, string> = {
  [-99]: '通过',
  [-1]: '待审核',
  1: '未确定',
  2: '低风险',
  3: '中风险',
  4: '高风险',
};

export const RISK_BEHAVIOR_TYPE_MAP: Record<number, string> = {
  1: '最后充值方式',
  2: '最后充值金额',
  3: '最后提现信息',
  4: '最后充值信息1',
  5: '最后充值信息2',
};

export function formatVenueTransferState(state?: number | string) {
  if (state === undefined || state === null || state === '') {
    return '-';
  }
  return VENUE_TRANSFER_STATE_MAP[Number(state)] || String(state);
}

export function formatTransferAccount(
  type?: number | string,
  gameId?: number | string,
  gameName?: string,
) {
  if (Number(type) === 1) {
    return '中心钱包';
  }
  return gameName || (gameId !== undefined ? String(gameId) : '-');
}
