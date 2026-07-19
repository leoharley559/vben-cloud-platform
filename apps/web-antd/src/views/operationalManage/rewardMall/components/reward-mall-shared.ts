import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import {
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';

export { formatPercentFromStorage, formatPercentToStorage };

/* ==================== 商品类型（1实体 2彩金 3票券） ==================== */

export const REWARD_PRODUCT_TYPE = {
  PHYSICAL: 1,
  CASH: 2,
  VOUCHER: 3,
} as const;

export const REWARD_PRODUCT_TYPE_OPTIONS = [
  { label: '实体商品', value: REWARD_PRODUCT_TYPE.PHYSICAL },
  { label: '彩金', value: REWARD_PRODUCT_TYPE.CASH },
  { label: '票券', value: REWARD_PRODUCT_TYPE.VOUCHER },
];

export const REWARD_PRODUCT_TYPE_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  ...REWARD_PRODUCT_TYPE_OPTIONS,
];

/* ==================== VIP 等级 ==================== */

/** 供筛选使用（含“全部”） */
export const REWARD_VIP_FILTER_OPTIONS = VIP_LEVEL_OPTIONS;

/** 积分配置表格固定行：VIP0~VIP15 */
export const REWARD_VIP_LEVELS = Array.from(
  { length: 16 },
  (_, level) => level,
);

/* ==================== 兑换记录 ==================== */

export const REWARD_EXCHANGE_STATUS_OPTIONS = [
  { color: 'warning', label: '待审核', value: 1 },
  { color: 'success', label: '成功', value: 2 },
  { color: 'error', label: '失败', value: 4 },
];

export const REWARD_EXCHANGE_STATUS_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  ...REWARD_EXCHANGE_STATUS_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
];

export function formatRewardExchangeStatus(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return (
    REWARD_EXCHANGE_STATUS_OPTIONS.find(
      (item) => Number(item.value) === Number(value),
    )?.label || String(value)
  );
}

export function getRewardExchangeStatusColor(value?: number | string) {
  return (
    REWARD_EXCHANGE_STATUS_OPTIONS.find(
      (item) => Number(item.value) === Number(value),
    )?.color || 'default'
  );
}

export const REWARD_WATER_REQUIRE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];

export function formatRewardIsWater(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return Number(value) === 1 ? '是' : '否';
}

/* ==================== 积分记录（旧站 pointsRecord.vue 保留字段） ==================== */

/** 红利类型：0积分商城 1投注积分返水 2存款积分返水 3活动红利 4积分调整 5排行榜 6N级代理 */
export const REWARD_POINT_BONUS_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '积分商城', value: 0 },
  { label: '投注积分返水', value: 1 },
  { label: '存款积分返水', value: 2 },
  { label: '活动红利', value: 3 },
  { label: '积分调整', value: 4 },
  { label: '排行榜', value: 5 },
  { label: 'N级代理', value: 6 },
];

export function formatRewardPointBonusType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return (
    REWARD_POINT_BONUS_TYPE_OPTIONS.find((item) => item.value === Number(value))
      ?.label || String(value)
  );
}

/** 活动分类：1每日签到 2存款积分返水 3投注积分返水 132成就奖励 */
export const REWARD_POINT_BONUS_CATEGORY_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '每日签到', value: 1 },
  { label: '存款积分返水', value: 2 },
  { label: '投注积分返水', value: 3 },
  { label: '成就奖励', value: 132 },
];

export function formatRewardPointBonusCategory(
  row: {
    ActivityType?: number | string;
    BonusCategory?: number | string;
    BonusType?: number;
  },
  activityTypeLabel = '',
) {
  if (Number(row.BonusType) === 3) {
    return activityTypeLabel || String(row.ActivityType ?? '-');
  }
  if (Number(row.BonusType) === 6) {
    return '成就奖励';
  }
  if (
    row.BonusCategory === undefined ||
    row.BonusCategory === null ||
    row.BonusCategory === ''
  ) {
    return '-';
  }
  return (
    REWARD_POINT_BONUS_CATEGORY_OPTIONS.find(
      (item) => item.value === Number(row.BonusCategory),
    )?.label || String(row.BonusCategory)
  );
}

/** 发放方式：0自动发放 1手动领取 2手动发放 3审核后发放 */
export const REWARD_POINT_SEND_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '自动发放', value: 0 },
  { label: '手动领取', value: 1 },
  { label: '手动发放', value: 2 },
  { label: '审核后发放', value: 3 },
];

export function formatRewardPointSendType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return (
    REWARD_POINT_SEND_TYPE_OPTIONS.find((item) => item.value === Number(value))
      ?.label || String(value)
  );
}

/* ==================== 积分调整记录/审核（旧站 pointsAdjust） ==================== */

/** 游戏状态：0未发送 1已发送 2已完成 3失败 4发送失败 */
export const REWARD_ADJUST_DONE_OPTIONS = [
  { label: '全部', value: '0,1,2,3,4' },
  { label: '未发送', value: 0 },
  { label: '已发送', value: 1 },
  { label: '已完成', value: 2 },
  { label: '失败', value: 3 },
  { label: '发送失败', value: 4 },
];

const REWARD_ADJUST_DONE_MAP: Record<number, string> = {
  0: '未发送',
  1: '已发送',
  2: '已完成',
  3: '失败',
  4: '发送失败',
};

export function formatRewardAdjustDone(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return REWARD_ADJUST_DONE_MAP[Number(value)] || String(value);
}

export function getRewardAdjustDoneColor(
  value?: number | string,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  switch (Number(value)) {
    case 1: {
      return 'processing';
    }
    case 2: {
      return 'success';
    }
    case 3: {
      return 'warning';
    }
    case 4: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

/** 调整方式：1上分 2下分 */
export const REWARD_ADJUST_HANDLE_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '上分', value: 1 },
  { label: '下分', value: 2 },
];

export function formatRewardAdjustHandleType(value?: number | string) {
  if (Number(value) === 1) {
    return '上分';
  }
  if (Number(value) === 2) {
    return '下分';
  }
  if (value === '' || value === undefined || value === null) {
    return '全部';
  }
  return '未知类型';
}

export function getRewardAdjustHandleTypeColor(value?: number | string) {
  if (Number(value) === 1) {
    return '#67c23a';
  }
  if (Number(value) === 2) {
    return '#f56c6c';
  }
  return '#909399';
}

/** 调整类型：目前仅 1 积分调整 */
export const REWARD_ADJUST_TYPE_OPTIONS = [{ label: '积分调整', value: 1 }];

/** 审核状态：1待审核 2通过 3拒绝 4进行中 */
export const REWARD_ADJUST_APPROVE_RECORD_OPTIONS = [
  { label: '全部', value: '2,3,4' },
  { label: '通过', value: 2 },
  { label: '拒绝', value: 3 },
  { label: '进行中', value: 4 },
];

const REWARD_ADJUST_APPROVE_MAP: Record<number, string> = {
  1: '待审核',
  2: '通过',
  3: '拒绝',
  4: '进行中',
};

export function formatRewardAdjustApprove(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return REWARD_ADJUST_APPROVE_MAP[Number(value)] || String(value);
}

export function getRewardAdjustApproveColor(
  value?: number | string,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  switch (Number(value)) {
    case 1: {
      return 'warning';
    }
    case 2: {
      return 'success';
    }
    case 3: {
      return 'error';
    }
    case 4: {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
}

/* ==================== 通用：LangText / JSON 解析 ==================== */

/** 解析 LangText（JSON 字符串或对象/数组），取首个语言群组的字段 */
export function resolveLangField(raw: unknown, field: string, fallback = '-') {
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      const first = parsed[0] as Record<string, unknown> | undefined;
      return (first?.[field] as string) || fallback;
    }
    if (parsed && typeof parsed === 'object') {
      const first = Object.values(parsed as Record<string, unknown>)[0] as
        | Record<string, unknown>
        | undefined;
      return (first?.[field] as string) || fallback;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

/** 解析后端 Config JSON 字符串数组字段（水位/返水等配置） */
export function parseConfigArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ==================== 金额/积分格式化 ==================== */

/** 积分为整数，无需分转元 */
export function formatRewardPoint(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

export function centsToYuan(value?: number | string | null) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  return Math.round(Number(value)) / 100;
}

export function yuanToCents(value?: number | string | null) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  return Math.round(Number(value) * 100);
}

/* ==================== 积分设置：存款/投注返水配置行 ==================== */

export interface RewardDepositConfigRow {
  DailyMaxPoint: number;
  /** 编辑态使用元；提交时需转换为分 */
  DailyMinPayment: number;
  Vip: number;
}

export interface RewardBetConfigGameRatio {
  /** 游戏 ID */
  Id: number;
  /** 百分比存储格式（如 50.5% -> 5050），对齐旧站 numFormat */
  Ratio: number;
}

export interface RewardBetConfigRow {
  DailyMaxPoint: number;
  /** 编辑态使用元；提交时需转换为分 */
  DailyMinBet: number;
  /** 百分比存储格式（如 50.5% -> 5050） */
  DefaultWater: number;
  Games: RewardBetConfigGameRatio[];
  Vip: number;
}

/** 补齐 VIP0~15 全部行，缺失的行使用默认值填充 */
export function ensureVipRows<T extends { Vip: number }>(
  rows: T[],
  createDefault: (vip: number) => T,
): T[] {
  const map = new Map(rows.map((row) => [Number(row.Vip), row]));
  return REWARD_VIP_LEVELS.map((vip) => map.get(vip) || createDefault(vip));
}
