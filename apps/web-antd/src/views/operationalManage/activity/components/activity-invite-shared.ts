import type { InviteFriendTier } from '#/api/operationManage/invite-friend-activity';

/** 邀请关系 RewardStatus */
export const INVITE_RELATION_STATUS_MAP: Record<number, string> = {
  1: '已绑定，尚未充值',
  2: '已充值，累计未达标',
  3: '已达标，等待风控或发奖',
  4: '风控拒绝',
  5: '已发奖',
  6: '发奖失败',
  7: '活动结束未达标',
};

export const INVITE_RELATION_STATUS_OPTIONS = Object.entries(
  INVITE_RELATION_STATUS_MAP,
).map(([value, label]) => ({ label, value: Number(value) }));

/** 发放记录 RewardStatus */
export const INVITE_REWARD_STATUS_MAP: Record<number, string> = {
  1: '待发放',
  2: '已发放',
  3: '发放失败',
};

export const INVITE_REWARD_STATUS_OPTIONS = Object.entries(
  INVITE_REWARD_STATUS_MAP,
).map(([value, label]) => ({ label, value: Number(value) }));

export const INVITE_REWARD_ROLE_MAP: Record<string, string> = {
  invitee: '被邀请人奖励',
  inviter: '邀请人奖励',
};

export const INVITE_REWARD_ROLE_OPTIONS = [
  { label: '邀请人奖励', value: 'inviter' },
  { label: '被邀请人奖励', value: 'invitee' },
];

export const INVITE_SOURCE_OPTIONS = [
  { label: '链接', value: 'link' },
  { label: '二维码', value: 'qrcode' },
  { label: '邀请码', value: 'code' },
];

export const INVITE_RISK_DIMENSION_OPTIONS = [
  { label: 'IP', value: 'ip' },
  { label: '设备', value: 'device' },
  { label: '手机号', value: 'phone' },
  { label: '姓名', value: 'name' },
  { label: '邮箱', value: 'email' },
  { label: '银行卡', value: 'bankcard' },
];

/** RiskReason 命中原因（对接文档 2.4） */
export const INVITE_RISK_REASON_MAP: Record<string, string> = {
  same_bankcard: '同一银行卡号',
  same_device: '同一设备',
  same_email: '同一邮箱',
  same_ip: '同一IP',
  same_name: '同一姓名',
  same_phone: '同一手机号',
};

export const INVITE_RISK_ACTION_OPTIONS = [{ label: '拒绝发奖', value: 1 }];

/** 对接文档 IncludeDepositTypes 当前仅约定 success */
export const INVITE_DEPOSIT_TYPE_OPTIONS = [
  { label: '真实充值成功', value: 'success' },
];

export const INVITE_IS_ACTIVE_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];

/** 对接文档 RiskDimensions 全量可选值 */
export const INVITE_DEFAULT_RISK_DIMENSIONS = [
  'ip',
  'device',
  'phone',
  'name',
  'email',
  'bankcard',
];

export function formatInviteRelationStatus(value?: number | string) {
  const key = Number(value);
  return INVITE_RELATION_STATUS_MAP[key] || (value ? String(value) : '-');
}

export function formatInviteRewardStatus(value?: number | string) {
  const key = Number(value);
  return INVITE_REWARD_STATUS_MAP[key] || (value ? String(value) : '-');
}

export function formatInviteRewardRole(value?: string) {
  if (!value) return '-';
  return INVITE_REWARD_ROLE_MAP[value] || value;
}

export function formatInviteSource(value?: string) {
  if (!value) return '-';
  const found = INVITE_SOURCE_OPTIONS.find((item) => item.value === value);
  return found?.label || value;
}

/** 风控原因：支持单值、逗号分隔或多个命中原因 */
export function formatInviteRiskReason(value?: null | string | string[]) {
  if (value === undefined || value === null || value === '') return '-';
  const list = Array.isArray(value)
    ? value
    : String(value)
        .split(/[,，;；|]/)
        .map((item) => item.trim())
        .filter(Boolean);
  if (list.length === 0) return '-';
  return list.map((code) => INVITE_RISK_REASON_MAP[code] || code).join('、');
}

export function formatRiskDimensions(values?: string | string[]) {
  const list = Array.isArray(values)
    ? values
    : (typeof values === 'string' && values.trim()
      ? (() => {
          try {
            const parsed = JSON.parse(values) as unknown;
            return Array.isArray(parsed) ? (parsed as string[]) : [];
          } catch {
            return [];
          }
        })()
      : []);
  if (list.length === 0) return '-';
  return list
    .map(
      (value) =>
        INVITE_RISK_DIMENSION_OPTIONS.find((item) => item.value === value)
          ?.label || value,
    )
    .join('、');
}

export function formatInviterTiers(tiers?: InviteFriendTier[] | string) {
  const list = Array.isArray(tiers)
    ? tiers
    : (typeof tiers === 'string' && tiers.trim()
      ? (() => {
          try {
            const parsed = JSON.parse(tiers) as unknown;
            return Array.isArray(parsed) ? (parsed as InviteFriendTier[]) : [];
          } catch {
            return [];
          }
        })()
      : []);
  if (list.length === 0) return '-';
  return list
    .map((tier) => {
      const max =
        Number(tier.MaxCount) === 0 ? '∞' : String(tier.MaxCount ?? '');
      return `${tier.MinCount}-${max}人 / ${(Number(tier.Reward) / 100).toFixed(2)}`;
    })
    .join('；');
}

/**
 * 新建默认阶梯（金额单位：分）
 * 区间连续、最后一档 MaxCount=0 表示无上限，符合对接文档校验规则。
 */
export function createDefaultInviteTiers(): InviteFriendTier[] {
  return [
    { MaxCount: 1, MinCount: 1, Reward: 800 },
    { MaxCount: 3, MinCount: 2, Reward: 900 },
    { MaxCount: 6, MinCount: 4, Reward: 1000 },
    { MaxCount: 10, MinCount: 7, Reward: 1100 },
    { MaxCount: 20, MinCount: 11, Reward: 1200 },
    { MaxCount: 50, MinCount: 21, Reward: 1500 },
    { MaxCount: 100, MinCount: 51, Reward: 2000 },
    { MaxCount: 0, MinCount: 101, Reward: 3000 },
  ];
}

export function createDefaultInviteConfigForm(langGroupId = 0) {
  const now = Math.floor(Date.now() / 1000);
  return {
    Banner: '',
    BeginTime: now,
    /** 默认 100 元（分） */
    DepositThreshold: 10_000,
    EndTime: now + 30 * 24 * 3600,
    IncludeDepositTypes: ['success'],
    InviterTiers: createDefaultInviteTiers(),
    /** 默认 8 元（分） */
    InviteeReward: 800,
    IsActive: 1,
    LangGroupId: langGroupId,
    Open: false,
    RiskAction: 1,
    RiskDimensions: [...INVITE_DEFAULT_RISK_DIMENSIONS],
    RuleContent: [''],
    ShareImage: '',
    ShareUrlTemplate: '',
    Title: '邀请好友送彩金',
    WaterMultiple: 1,
  };
}

/** 元 → 分 */
export function yuanToCent(value?: null | number | string) {
  if (value === undefined || value === null || value === '') return 0;
  return Math.round(Number(value) * 100);
}

/** 分 → 元（表单展示） */
export function centToYuan(value?: null | number | string) {
  if (value === undefined || value === null || value === '') return 0;
  return Number((Number(value) / 100).toFixed(2));
}
