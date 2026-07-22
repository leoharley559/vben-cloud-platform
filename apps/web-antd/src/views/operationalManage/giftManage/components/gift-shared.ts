import dayjs from 'dayjs';

import { formatActivityType } from '#/utils/bonus-reward';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  GIFT_AUDIT_STATUS_MAP,
  GIFT_DELIVER_STATUS_MAP,
} from '#/utils/operation-status';
import { formatPlayerStatus } from '#/utils/player-status';

export const GIFT_TYPE_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '实物奖品', value: '1' },
  { label: '虚拟奖品', value: '2' },
];

export const GIFT_LUCKY_AUDIT_STATUS_OPTIONS = [
  { label: '全部', value: '0' },
  { label: '待审核', value: '-1' },
  { label: '通过', value: '1' },
  { label: '拒绝', value: '2' },
];

export const GIFT_LUCKY_DELIVER_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待发货', value: '1' },
  { label: '已发货', value: '3' },
  { label: '拒绝发货', value: '5' },
];

export const GIFT_IS_MANUAL_OPTIONS = [
  { label: '全部', value: '-1' },
  { label: '否', value: '0' },
  { label: '是', value: '1' },
];

export const GIFT_RISK_OPTIONS = [
  { label: '全部', value: '' },
  { label: '同IP', value: '同IP' },
  { label: '同设备', value: '同设备' },
];

export const LUCKY_DRAW_BONUS_CATEGORY_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '存款转盘抽奖', value: 1 },
  { label: '存款主题抽奖', value: 2 },
  { label: '投注转盘抽奖', value: 3 },
  { label: '投注主题抽奖', value: 4 },
];

export const ACTIVITY_TYPE_LUCKY_DRAW = 10008;

/** 礼品主题抽奖页活动类型（对齐旧站 useActivityConst 过滤） */
export const GIFT_LUCKY_ACTIVITY_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '主题抽奖', value: 10008 },
  { label: 'N级代理', value: 10018 },
  { label: '票券', value: 10019 },
  { label: '积分商城', value: 10021 },
  { label: '排行榜', value: 10027 },
];

export function giftListTotal(
  pagination?: { MaxCount?: number | string | null } | null,
  itemsLength = 0,
) {
  const maxCount = pagination?.MaxCount;
  if (maxCount === undefined || maxCount === null || maxCount === '') {
    return itemsLength;
  }
  return Number(maxCount);
}
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

export function parseGiftNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string' && value) {
    return value.split('+').filter(Boolean);
  }
  return [];
}

export function giftNameText(value: unknown) {
  const names = parseGiftNames(value);
  return names.length ? names.join(',') : '-';
}

export function formatVipLevel(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return `VIP${value}`;
}

export function formatGiftType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const num = Number(value);
  if (num === 1) {
    return '实物奖品';
  }
  if (num === 2) {
    return '虚拟奖品';
  }
  return String(value);
}

export function formatGiftAuditStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '待审核';
  }
  return GIFT_AUDIT_STATUS_MAP[Number(status)] || String(status);
}

export function formatGiftDeliverStatus(status?: number | string) {
  if (status === undefined || status === null || status === '') {
    return '-';
  }
  return GIFT_DELIVER_STATUS_MAP[Number(status)] || String(status);
}

export function formatIsManual(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return Number(value) === 1 ? '是' : '否';
}

export function formatLuckyBonusCategory(
  activityType?: number | string,
  category?: number | string,
) {
  if (Number(activityType) !== ACTIVITY_TYPE_LUCKY_DRAW) {
    return '-';
  }
  const item = LUCKY_DRAW_BONUS_CATEGORY_OPTIONS.find(
    (option) => option.value === Number(category),
  );
  return item?.label || String(category ?? '-');
}

export function formatPlayerMetric(row: Record<string, unknown>) {
  const recharge = row.Recharge ?? row.Gold;
  const bet = row.Bet;
  const rechargeText =
    recharge === undefined || recharge === null || recharge === ''
      ? '-'
      : formatAmountFromCent(recharge as number | string);
  const betText =
    bet === undefined || bet === null || bet === ''
      ? '-'
      : formatAmountFromCent(bet as number | string);
  return `${rechargeText} / ${betText}`;
}

export { formatActivityType, formatAmountFromCent, formatPlayerStatus };
