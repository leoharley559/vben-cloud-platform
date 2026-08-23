/** 构建代理详情路由路径 */
export function buildAgencyDetailPath(adminId: number | string) {
  return `/netcash/agencyAccountDetails/${adminId}`;
}

export type AgencyDetailQuery = {
  CountBeginTime?: number | string;
  CountEndTime?: number | string;
  Name?: string;
};

const AGENCY_ADMIN_ID_KEYS = [
  'AdminId',
  'CreateAdminId',
  'AgentAdminId',
  'MainAdminId',
  'ParentAdminId',
  'AgentId',
] as const;

/** 从行数据解析可用于跳转的代理 AdminId */
export function resolveAgencyAdminId(
  row: null | object | undefined,
  ...preferredKeys: string[]
) {
  if (!row) return undefined;
  const record = row as Record<string, unknown>;
  const keys = preferredKeys.length > 0 ? preferredKeys : [...AGENCY_ADMIN_ID_KEYS];
  for (const key of keys) {
    const value = record[key];
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      Number(value) !== 0
    ) {
      return value as number | string;
    }
  }
  return undefined;
}
