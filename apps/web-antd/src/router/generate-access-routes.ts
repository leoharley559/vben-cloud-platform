import type { Router } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import { generateAccess } from '#/router/access';
import { accessRoutes } from '#/router/routes';
import { useCloudPlatformStore } from '#/store/cloud-platform';

/**
 * 对齐旧站 GenerateRoutes：基于当前 Nav / roles 生成菜单与动态路由
 */
export async function generateAccessRoutes(router: Router) {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const cloudStore = useCloudPlatformStore();

  if (!cloudStore.navMenus.length) {
    throw new Error('暂没有配置节点菜单');
  }

  const { accessibleMenus, accessibleRoutes } = await generateAccess({
    roles: userStore.userInfo?.roles ?? [],
    router,
    routes: accessRoutes,
  });

  accessStore.setAccessMenus(accessibleMenus);
  accessStore.setAccessRoutes(accessibleRoutes);
  accessStore.setIsAccessChecked(true);

  return { accessibleMenus, accessibleRoutes };
}

/**
 * 是否已具备旧站意义上的「roles 已加载」：有 Role 即视为已拉过 islogin
 * （roles 不持久化，F5 后为空，会重新走 GetUserInfo + GenerateRoutes）
 */
export function hasSessionRoles() {
  return useCloudPlatformStore().roles.length > 0;
}
