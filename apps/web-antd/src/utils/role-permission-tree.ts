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
  const seen = new Set<number>();

  for (const key of keys) {
    const id = Number(key);
    if (Number.isNaN(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
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

/**
 * 编辑回显：全选子树进 checked，部分授权进 halfChecked。
 * 父节点（日常运营 / 玩家详情 / 充值列表等）绝不能在子孙未齐时放进 checked，
 * 否则 checkStrictly=false 时 Tree 会把未授权子孙全部勾上。
 */
export function echoRoleTreeCheckState(
  tree: RoleTreeNode[],
  savedIds: Array<number | string>,
) {
  const saved = new Set(
    savedIds.map(Number).filter((item) => !Number.isNaN(item) && item !== 0),
  );
  const checked: number[] = [];
  const halfChecked: number[] = [];

  function walk(node: RoleTreeNode): { selected: number; total: number } {
    const children = node.children ?? [];
    const id = Number(node.key);

    if (children.length === 0) {
      const selected = saved.has(id) ? 1 : 0;
      if (selected) {
        checked.push(id);
      }
      return { selected, total: 1 };
    }

    let selected = 0;
    let total = 0;
    for (const child of children) {
      const result = walk(child);
      selected += result.selected;
      total += result.total;
    }

    if (total > 0 && selected === total) {
      checked.push(id);
    } else if (selected > 0 || saved.has(id)) {
      // 半选父节点不能进 checked，否则级联会把未授权子孙全部勾上
      halfChecked.push(id);
    }

    return { selected, total };
  }

  for (const node of tree) {
    walk(node);
  }

  return { checked, halfChecked };
}

/** 把已勾选节点的祖先补进保存列表（半选父菜单仍要写入 MenuIds） */
export function collectRoleTreeAncestorKeys(
  tree: RoleTreeNode[],
  checkedKeys: Array<number | string>,
) {
  const checked = new Set(
    checkedKeys.map(Number).filter((item) => !Number.isNaN(item) && item !== 0),
  );
  const ancestors: number[] = [];

  function walk(node: RoleTreeNode): boolean {
    const selfChecked = checked.has(Number(node.key));
    let childChecked = false;
    for (const child of node.children ?? []) {
      if (walk(child)) {
        childChecked = true;
      }
    }
    if (!selfChecked && childChecked) {
      ancestors.push(Number(node.key));
      return true;
    }
    return selfChecked || childChecked;
  }

  for (const node of tree) {
    walk(node);
  }

  return ancestors;
}

export function isSystemBuiltinRole(row: {
  AdminId?: number;
  CreateAdminId?: number;
}) {
  return row.AdminId === -1 && row.CreateAdminId === -1;
}
