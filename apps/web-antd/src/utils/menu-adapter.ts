import type { RouteRecordStringComponent } from '@vben/types';

import type { CloudNavItem, CloudProjectConfig } from '#/types/cloud-platform';

import { translateMenuTitle } from '#/utils/menu-i18n';
import { resolveMenuIcon } from '#/utils/menu-icon-map';

/** 未迁移页面统一落到占位页，避免登录后整站 404/403 */
const PLACEHOLDER_COMPONENT = '/cloud/placeholder/index';

interface BuiltRouteNode {
  children: BuiltRouteNode[];
  hidden: boolean;
  icon?: string;
  id: number;
  keepAlive: boolean;
  name: string;
  path: string;
  parentId: number;
}

function buildParentMap(navItems: CloudNavItem[]) {
  const parentMap = new Map<number, Map<number, CloudNavItem>>();
  for (const item of navItems) {
    if (!parentMap.has(item.ParentId)) {
      parentMap.set(item.ParentId, new Map());
    }
    parentMap.get(item.ParentId)!.set(item.Id, item);
  }
  return parentMap;
}

function parseHaveFunctionValues(roleDataField: unknown): null | string[] {
  if (!roleDataField) {
    // 对齐旧站：无 RoleDataField 时不拦截菜单
    return null;
  }

  try {
    const parsed =
      typeof roleDataField === 'string'
        ? (JSON.parse(roleDataField) as { HaveFunction?: unknown })
        : (roleDataField as { HaveFunction?: unknown });
    const raw = parsed.HaveFunction;
    if (raw == null || raw === '') {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw.map(String);
    }
    return String(raw)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hasAnyHaveFunction(roleDataField: unknown, indexes: string[]) {
  const values = parseHaveFunctionValues(roleDataField);
  if (values === null) {
    return true;
  }
  return indexes.some((index) => values.includes(index));
}

function shouldAppendMenu(
  child: CloudNavItem,
  projectConfig: CloudProjectConfig | null,
) {
  const roleDataField = projectConfig?.RoleDataField;
  const isShareServer = projectConfig?.AgentAccount?.IsShareServer ?? 1;
  const isKillPower = projectConfig?.AgentAccount?.KillPower ?? 2;
  const isOneTui =
    projectConfig?.AccountTeamInfo?.AgentId !==
    projectConfig?.AccountTeamInfo?.ParentId;
  const agentVersion = projectConfig?.AgentVersion;

  const conditionalMenus = new Set([
    'cloneChannel',
    'dropDeploy',
    'everydayData',
    'gameManage',
    'playerControl',
    'promoteData',
    'sonGameManage',
    'stockManage',
    'timeshareData',
    'virtualReport',
  ]);

  if (!conditionalMenus.has(child.Name)) {
    return true;
  }

  switch (child.Name) {
    case 'cloneChannel': {
      return !!isOneTui;
    }
    case 'dropDeploy':
    case 'gameManage': {
      return !isOneTui;
    }
    case 'everydayData': {
      return hasAnyHaveFunction(roleDataField, ['1', '2']);
    }
    case 'playerControl':
    case 'stockManage': {
      return isShareServer === 2 && isKillPower === 1;
    }
    case 'promoteData': {
      return hasAnyHaveFunction(roleDataField, ['3']);
    }
    case 'sonGameManage': {
      return isShareServer === 2;
    }
    case 'timeshareData': {
      return hasAnyHaveFunction(roleDataField, ['4']);
    }
    case 'virtualReport': {
      return agentVersion === 'v2';
    }
    default: {
      return true;
    }
  }
}

function resolveComponentPath(routerPath: string) {
  if (routerPath.includes('playerDetails')) {
    return '/operationalManage/playerDetails/index';
  }
  if (routerPath.includes('agencyAccountDetails')) {
    return '/netcash/agencyAccountDetails';
  }
  // 日报菜单路由对齐公司日报页
  if (/(^|\/)dayReport(\/|$)/.test(routerPath)) {
    return routerPath.replaceAll('dayReport', 'everydayData');
  }
  // macOS 大小写不敏感；统一到已存在的小写目录
  if (/(^|\/)serviceRecord(\/|$)/.test(routerPath)) {
    return routerPath.replaceAll('serviceRecord', 'servicerecord');
  }

  return routerPath.startsWith('/') ? routerPath : `/${routerPath}`;
}

/**
 * 当前仓库已存在的视图路径（用于判断是否需要占位）
 * access.ts 的 glob 是相对 router 目录的；这里相对 utils 目录
 */
const existingViewKeys = Object.keys(import.meta.glob('../views/**/*.vue')).map(
  (key) => {
    const normalized = key
      .replace(/^\.\.\//, '/')
      .replace(/^\/views/, '')
      .replace(/\.vue$/, '');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  },
);

const existingViewSet = new Set(existingViewKeys);

function resolveLeafComponent(routerPath: string) {
  const componentPath = resolveComponentPath(routerPath);
  const normalized = componentPath.startsWith('/')
    ? componentPath
    : `/${componentPath}`;

  // Vben pageMap key 形如 `/xxx/index.vue`，必须返回带 /index 的路径
  // 否则会查 `/xxx.vue` 失败并落到 not-found（表现为 404）
  if (existingViewSet.has(`${normalized}/index`)) {
    return `${normalized}/index`;
  }
  if (existingViewSet.has(normalized)) {
    return normalized;
  }
  return PLACEHOLDER_COMPONENT;
}

function buildRouteTree(
  parentId: number,
  parentMap: Map<number, Map<number, CloudNavItem>>,
  projectConfig: CloudProjectConfig | null,
): BuiltRouteNode[] {
  const children = [...(parentMap.get(parentId)?.values() || [])];
  const routes: BuiltRouteNode[] = [];

  for (const child of children) {
    if (!shouldAppendMenu(child, projectConfig)) {
      continue;
    }

    const routeNode: BuiltRouteNode = {
      children: [],
      // 对齐旧站 permission.js：hidden = IsShow == '1'（宽松比较）
       
      hidden: child.IsShow == '1',
      icon: resolveMenuIcon(child.Name, child.Router),
      id: child.Id,
       
      keepAlive: child.KeepAlive == '1',
      name: child.Name,
      parentId: child.ParentId,
      path: child.Router,
    };

    routeNode.children = buildRouteTree(child.Id, parentMap, projectConfig);
    routes.push(routeNode);
  }

  return routes;
}

function toVbenRoute(
  node: BuiltRouteNode,
  isTopLevel = false,
): RouteRecordStringComponent {
  const path = node.path.startsWith('/') ? node.path : `/${node.path}`;
  const route: RouteRecordStringComponent = {
    meta: {
      hideInMenu: node.hidden,
      icon: resolveMenuIcon(node.name, node.path),
      keepAlive: node.keepAlive,
      // 详情页 query（时间、姓名）不参与 tab key，避免同代理反复开页触发 DOM 冲突
      ...(path.includes('agencyAccountDetails') ||
      path.includes('playerDetails')
        ? { fullPathKey: false }
        : {}),
      originalPath: path,
      title: translateMenuTitle(node.name),
    },
    name: `${node.name}_${node.id}`,
    path,
  };

  const isMobileRoute =
    path.includes('/mobile/') ||
    path.startsWith('/mobile') ||
    path.includes('/mobileCloud');
  if (isMobileRoute) {
    route.meta = {
      ...route.meta,
      noBasicLayout: true,
      title: route.meta?.title || translateMenuTitle(node.name),
    };
  }

  if (node.children.length > 0) {
    // 有子菜单的父级不挂页面组件，由框架自动 redirect 到第一个子路由
    route.children = node.children.map((child) => toVbenRoute(child, false));
    if (isTopLevel) {
      // 顶级由 accessible 挂到 Root/BasicLayout，这里不设 BasicLayout，避免双层布局
      route.component = PLACEHOLDER_COMPONENT;
    } else {
      route.component = PLACEHOLDER_COMPONENT;
    }
  } else {
    route.component = resolveLeafComponent(node.path);
    if (route.component === PLACEHOLDER_COMPONENT) {
      route.meta = {
        ...route.meta,
        originalPath: path,
      };
    }
  }

  return route;
}

/**
 * 将 cloudPlatform 扁平 Nav 转为 Vben backend 菜单结构
 * 对齐旧站 GenerateRoutes：剔除无子菜单的一级菜单
 */
export function convertNavToVbenRoutes(
  navItems: CloudNavItem[],
  projectConfig: CloudProjectConfig | null,
): RouteRecordStringComponent[] {
  const parentMap = buildParentMap(navItems);
  const topLevelRoutes = buildRouteTree(-1, parentMap, projectConfig).filter(
    (item) => item.children.length > 0,
  );

  return topLevelRoutes.map((route) => toVbenRoute(route, true));
}

/**
 * 登录后默认首页：数据总览（前端路由，保证可打开）
 */
export function resolveHomePathFromNav(_navItems: CloudNavItem[]) {
  return '/dashboard/index';
}
