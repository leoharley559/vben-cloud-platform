import { formatAmountFromCent } from '#/utils/format-amount';

export const BONUS_TYPE_OPTIONS = [
  { label: '平台红利', value: 3 },
  { label: '升级红利', value: 4 },
  { label: '每月红包', value: 5 },
  { label: '生日礼金', value: 6 },
  { label: '代理红利', value: 7 },
  { label: '推广红利', value: 8 },
  { label: '存款优惠', value: 9 },
  { label: '活动红利', value: 10 },
  { label: '负数置零', value: 11 },
  { label: '推荐红利', value: 12 },
  { label: '预约提款', value: 13 },
  { label: '确认到账', value: 119 },
  { label: '代理代存红利', value: 123 },
  { label: '首存优惠', value: 125 },
  { label: '代金券', value: 130 },
];

export const BONUS_ORDER_STATUS_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '发放成功', value: 2 },
  { label: '已拒绝', value: 4 },
];

export const SEND_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '自动发放', value: 0 },
  { label: '手动领取', value: 1 },
  { label: '手动发放', value: 2 },
  { label: '审核后发放', value: 3 },
];

export const IS_WATER_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];

export const WATER_TYPE_FILTER_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '倍数', value: 1 },
  { label: '金额', value: 2 },
];

export const ACTIVITY_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '主题抽奖', value: 10008 },
  { label: '新手任务', value: 10009 },
  { label: '每日任务', value: 10013 },
  { label: '通用活动', value: 10015 },
  { label: '直播红包', value: 20001 },
  { label: '签到', value: 10020 },
  { label: '积分商城', value: 10021 },
  { label: '注册转盘', value: 10022 },
  { label: '首存转盘', value: 10016 },
];

export const PAGE_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '分类1', value: 1 },
  { label: '分类2', value: 2 },
  { label: '分类3', value: 3 },
  { label: '分类4', value: 4 },
  { label: '分类5', value: 5 },
];

export const OPERATOR_ACCOUNT_TYPE_OPTIONS = [
  { label: '申请人', value: 1 },
  { label: '审核人', value: 2 },
];

export const OPERATOR_REMARK_TYPE_OPTIONS = [
  { label: '申请备注', value: 1 },
  { label: '审核备注', value: 2 },
];

export const VIP_LEVEL_OPTIONS = [
  { label: '全部', value: -1 },
  ...Array.from({ length: 16 }, (_, level) => ({
    label: `VIP${level}`,
    value: level,
  })),
];

export const BONUS_EVENT_APPROVE_STATUS_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '待审核', value: 1 },
  { label: '通过', value: 2 },
  { label: '拒绝', value: 3 },
];

export const BONUS_EVENT_RISK_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '同IP', value: '同IP' },
  { label: '同设备', value: '同设备' },
];

const ACTIVITY_TYPE_MAP = Object.fromEntries(
  ACTIVITY_TYPE_OPTIONS.filter((item) => item.value !== -1).map((item) => [
    item.value,
    item.label,
  ]),
);

const BONUS_TYPE_MAP = Object.fromEntries(
  BONUS_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

const SEND_TYPE_MAP: Record<number, string> = {
  0: '自动发放',
  1: '手动领取',
  2: '手动发放',
  3: '审核后发放',
};

const BONUS_STATUS_MAP: Record<number, string> = {
  2: '成功',
  4: '失败',
};

const WATER_TYPE_MAP: Record<number, string> = {
  0: '倍数',
  1: '倍数',
  2: '金额',
};

export function formatBonusType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return BONUS_TYPE_MAP[Number(type)] || String(type);
}

export function formatBonusSendType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return SEND_TYPE_MAP[Number(type)] || String(type);
}

export function formatBonusStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return BONUS_STATUS_MAP[Number(status)] || String(status);
}

export function getBonusStatusColor(status?: number | string) {
  switch (Number(status)) {
    case 2:
      return '#52c41a';
    case 4:
      return '#ff4d4f';
    default:
      return '#8c8c8c';
  }
}

export function formatBonusWaterType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return WATER_TYPE_MAP[Number(type)] || String(type);
}

export function formatBonusAccount(account?: string) {
  if (!account) {
    return '-';
  }
  return account === 'system' ? '系统' : account;
}

export function formatBaseTurnover(row: {
  Draw?: number | string;
  WaterAmount?: number | string;
  WaterType?: number | string;
}) {
  if (Number(row.WaterType) === 2) {
    return (Number(row.WaterAmount || 0) / 100).toFixed(2);
  }
  return row.Draw ?? '-';
}

export function formatIsWater(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return Number(value) === 1 ? '是' : '否';
}

export function formatActivityType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return ACTIVITY_TYPE_MAP[Number(type)] || String(type);
}

export function formatBonusAmount(row: {
  Amount?: number | string;
  Bonus?: number | string;
}) {
  const value = row.Bonus ?? row.Amount;
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return formatAmountFromCent(value);
}

export function formatBonusNote(note?: string, operator?: string) {
  if (!note) {
    return '-';
  }
  if (operator === 'system') {
    return note;
  }
  return note;
}
