import type { CloudRole } from '#/types/cloud-platform';

import { useCloudPlatformStore } from '#/store/cloud-platform';

/** 权限 key → 子菜单 ID 列表（按需从各模块 permissionKeyList 汇总） */
const permissionKeyList: Record<string, Array<number | string>> = {
  // 系统管理 - 员工账号
  adminManageView: [10_018],
  adminManageAdd: [10_019],
  adminManageEdit: [10_020],
  adminManageDelete: [10_021],
  adminManageStatus: [10_022],
};

/**
 * 收集角色 SubMenuIds（对齐 cloudPlatform GLOBAL.checkPermission）
 * 后端可能返回：逗号分隔字符串 / 数组 / 单个数字
 */
function collectSubMenuIds(roles: CloudRole[]) {
  const ids = new Set<string>();

  for (const role of roles) {
    const raw = role.SubMenuIds;
    if (Array.isArray(raw)) {
      for (const id of raw) {
        ids.add(String(id));
      }
      continue;
    }
    if (typeof raw === 'string' && raw) {
      for (const id of raw.split(',')) {
        const trimmed = id.trim();
        if (trimmed) {
          ids.add(trimmed);
        }
      }
      continue;
    }
    if (raw !== undefined && raw !== null && raw !== '') {
      ids.add(String(raw));
    }
  }

  return ids;
}

/**
 * 检查子菜单/按钮权限
 * 对齐：cloudPlatform/src/components/Global/index.vue → checkPermission(mode)
 * 数据源：Role[].SubMenuIds（不是 Permission 数组）
 */
export function checkPermission(mode?: number | string) {
  if (mode === undefined || mode === null || mode === '') {
    return true;
  }

  const cloudStore = useCloudPlatformStore();
  const ids = collectSubMenuIds(cloudStore.roles);
  return ids.has(String(mode));
}

/** 任一权限命中即通过（对齐 GLOBAL.checkPermissionByKey） */
export function checkPermissionByKey(key: string) {
  const list = permissionKeyList[key];
  if (!list?.length) {
    return false;
  }
  return list.some((id) => checkPermission(id));
}

/** 全部权限均需命中（对齐 GLOBAL.checkPermissionWithKey） */
export function checkPermissionWithKey(key: string) {
  const list = permissionKeyList[key];
  if (!list?.length) {
    return true;
  }
  return list.every((id) => checkPermission(id));
}

export function registerPermissionKeys(
  entries: Record<string, Array<number | string>>,
) {
  Object.assign(permissionKeyList, entries);
}

/** 导出当前账号已拥有的 SubMenuIds（调试/自检用） */
export function getOwnedSubMenuIds() {
  const cloudStore = useCloudPlatformStore();
  return [...collectSubMenuIds(cloudStore.roles)];
}
