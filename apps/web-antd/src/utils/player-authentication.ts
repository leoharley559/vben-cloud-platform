import type { PlayerAuthRiskInfoItem } from '#/types/player-authentication';

export const AUTH_SCENARIO_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '存款时', value: 0 },
  { label: '提现时', value: 1 },
  { label: '注册时', value: 2 },
  { label: '活动中', value: 3 },
  { label: '修改用户名', value: 4 },
];

export const AUTH_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '已通过', value: 2 },
  { label: '已拒绝', value: 3 },
];

export const AUTH_SETTING_SUBTYPE_MAP: Record<number, string> = {
  1: '存款时',
  2: '提现时',
  3: '注册后',
  4: '活动中',
  1001: '手机号OTP验证',
  1002: '注册后限定时间内完成验证',
  1003: '同证件ID唯一校验',
};

const AUTH_SCENARIO_MAP: Record<number, string> = {
  0: '存款时',
  1: '提现时',
  2: '注册时',
  3: '活动中',
  4: '修改用户名',
};

const RISK_INFO_TYPE_MAP: Record<number, string> = {
  1: 'ID',
  2: '姓名',
  3: '出生日期',
};

export function formatAuthScenario(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return AUTH_SCENARIO_MAP[Number(value)] || String(value);
}

export function formatAuthSettingSubType(subType?: number) {
  if (!subType) {
    return '-';
  }
  return AUTH_SETTING_SUBTYPE_MAP[subType] || String(subType);
}

export function formatAuthStatus(status?: number | string) {
  if (Number(status) === 2) {
    return '已通过';
  }
  if (Number(status) === 3) {
    return '已拒绝';
  }
  if (Number(status) === 1) {
    return '待审核';
  }
  return '-';
}

export function getAuthStatusColor(status?: number | string) {
  if (Number(status) === 2) {
    return 'success';
  }
  if (Number(status) === 3) {
    return 'error';
  }
  if (Number(status) === 1) {
    return 'warning';
  }
  return 'default';
}

export function formatRiskInfoType(type?: number) {
  if (!type) {
    return '-';
  }
  return RISK_INFO_TYPE_MAP[type] || String(type);
}

export const AUTH_INFO_SWITCH_MAP: Record<number, string> = {
  1: '国籍',
  2: '出生地点',
  3: '永久地址',
  4: '现居地址',
  5: '工作性质',
  6: '收入来源',
  7: '通讯软件',
};

export function formatAuthInfoSwitchType(type?: number) {
  if (!type) {
    return '-';
  }
  return AUTH_INFO_SWITCH_MAP[type] || String(type);
}

export function parseRiskInfo(
  value?: PlayerAuthRiskInfoItem[] | string,
): PlayerAuthRiskInfoItem[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value) as PlayerAuthRiskInfoItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
