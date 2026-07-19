import type { RouteRecordStringComponent } from '@vben/types';

import { useCloudPlatformStore } from '#/store/cloud-platform';
import { convertNavToVbenRoutes } from '#/utils/menu-adapter';

/**
 * 从已加载的 Nav 生成 Vben backend 菜单
 */
export async function getAllMenusApi() {
  const cloudStore = useCloudPlatformStore();

  if (!cloudStore.navMenus.length) {
    throw new Error('菜单数据未加载，请先获取用户信息');
  }

  return convertNavToVbenRoutes(
    cloudStore.navMenus,
    cloudStore.projectConfig,
  ) as RouteRecordStringComponent[];
}
