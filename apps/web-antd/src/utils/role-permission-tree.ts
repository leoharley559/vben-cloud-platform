import type { CloudNavItem } from '#/types/cloud-platform';
import type { CloudSubMenuItem } from '#/types/system-manage';

import { translateMenuTitle } from '#/utils/menu-i18n';

export interface RoleTreeNode {
  children?: RoleTreeNode[];
  HaveDesData?: number;
  Id: number;
  key: number;
  Name: string;
  ParentId?: number;
  PubliceId?: string;
  title: string;
}

function buildNavTree(navItems: CloudNavItem[], parentId = -1): RoleTreeNode[] {
  const nodes: RoleTreeNode[] = [];

  for (const item of navItems) {
    if (item.ParentId !== parentId) {
      continue;
    }
    const children = buildNavTree(navItems, item.Id);
    nodes.push({
      Id: item.Id,
      Name: item.Name,
      ParentId: item.ParentId,
      children,
      key: item.Id,
      title: translateMenuTitle(item.Name),
    });
  }

  return nodes;
}

function normalizeSubMenus(subMenus: CloudSubMenuItem[]) {
  return subMenus.map((item) => {
    const parentId1 =
      item.ParentId === item.MenuId ? -1 : Number(item.ParentId ?? -1);
    return {
      ...item,
      ParentId1: parentId1,
      PubliceId: 'SubMenu',
    };
  });
}

function buildSubMenuTree(
  subMenus: Array<CloudSubMenuItem & { ParentId1?: number }>,
  parentId = -1,
): RoleTreeNode[] {
  const nodes: RoleTreeNode[] = [];

  for (const item of subMenus) {
    if (Number(item.ParentId1 ?? item.ParentId) !== parentId) {
      continue;
    }
    const children = buildSubMenuTree(subMenus, item.Id);
    nodes.push({
      HaveDesData: item.HaveDesData,
      Id: item.Id,
      Name: item.Name,
      ParentId: item.ParentId,
      PubliceId: item.PubliceId as string | undefined,
      children,
      key: item.Id,
      title: translateMenuTitle(item.Name),
    });
  }

  return nodes;
}

/** 合并 Nav 与 SubMenus，生成角色权限树 */
export function buildRolePermissionTree(
  navItems: CloudNavItem[],
  subMenus: CloudSubMenuItem[] = [],
) {
  const topNavNodes = buildNavTree(navItems, -1);
  const normalizedSubMenus = normalizeSubMenus(subMenus);
  const flatSubMenuRoots = buildSubMenuTree(normalizedSubMenus, -1);

  for (const topNode of topNavNodes) {
    if (!topNode.children?.length) {
      continue;
    }
    for (const child of topNode.children) {
      child.children = flatSubMenuRoots.filter(
        (item) => Number(item.ParentId) === child.Id,
      );
    }
  }

  return topNavNodes;
}

export function splitCheckedRoleKeys(keys: Array<number | string>) {
  const menuIds: number[] = [];
  const subMenuIds: number[] = [];

  for (const key of keys) {
    const id = Number(key);
    if (Number.isNaN(id)) {
      continue;
    }
    if (id >= 10_000) {
      subMenuIds.push(id);
    } else {
      menuIds.push(id);
    }
  }

  return { menuIds, subMenuIds };
}

export function mergeRoleCheckedKeys(
  menuIds?: Array<number | string> | string,
  subMenuIds?: Array<number | string> | string,
) {
  const menuList = Array.isArray(menuIds)
    ? menuIds
    : (menuIds
      ? String(menuIds).split(',')
      : []);
  const subMenuList = Array.isArray(subMenuIds)
    ? subMenuIds
    : (subMenuIds
      ? String(subMenuIds).split(',')
      : []);

  return [...menuList, ...subMenuList]
    .map(Number)
    .filter((item) => !Number.isNaN(item) && item !== 0);
}

export function isSystemBuiltinRole(row: {
  AdminId?: number;
  CreateAdminId?: number;
}) {
  return row.AdminId === -1 && row.CreateAdminId === -1;
}
