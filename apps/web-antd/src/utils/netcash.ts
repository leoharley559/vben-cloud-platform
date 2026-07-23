export const AGENCY_STATUS_MAP: Record<number, string> = {
  1: '启用',
  2: '停用',
};

export const AGENCY_TYPE_MAP: Record<number, string> = {
  1: '普通代理',
  2: '正式代理',
  3: '测试代理',
};

export const AGENCY_ACCOUNT_TYPE_MAP: Record<number, string> = {
  1: '单层',
  2: '多层单费率',
  3: '多层多费率',
};

export const SPILL_STATUS_MAP: Record<number, string> = {
  1: '申请中',
  2: '已通过',
  3: '已拒绝',
};

export const SPILL_STATUS_COLOR: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
};

export const REGISTER_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};

export function formatNetcashDateTime(value?: number | string) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    Number(value) === 0
  ) {
    return '-';
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).length >= 10) {
    const ms = String(value).length > 10 ? numeric : numeric * 1000;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  return String(value);
}

export const WITHDRAW_STATUS_MAP: Record<number, string> = {
  1: '待处理',
  2: '处理中',
  3: '已完成',
  4: '已拒绝',
};

export const BONUS_APPROVE_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};

export const CREDIT_APPROVE_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};
