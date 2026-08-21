import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { hasSessionRoles } from '#/router/generate-access-routes';
import { coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';
import { getCloudToken } from '#/utils/auth-token';
import {
  FORBIDDEN_PATH,
  hasRequiredAuthToken,
} from '#/utils/ensure-auth-token';

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫 — 对齐 cloudPlatform/src/permission.js
 *
 * 已登录且 roles 未加载（含 F5）：
 *   Promise.all(config + islogin) → GenerateRoutes → next({ ...to, replace: true })
 * 已登录且 roles 已加载：直接放行
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    // 对齐旧 App.vue initAuthToken：正式服只认 cookie `auth`，没有则 403（不是登录页）
    if (!hasRequiredAuthToken()) {
      if (to.path === FORBIDDEN_PATH) {
        return true;
      }
      return { path: FORBIDDEN_PATH, replace: true };
    }

    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 对齐旧站 getToken()：登录态以 cookie Cloud-Token 为准
    const cookieToken = getCloudToken();
    if (cookieToken && !accessStore.accessToken) {
      accessStore.setAccessToken(cookieToken);
    }

    // 403 在白名单：有 AuthToken 也可停留（对齐旧 permission.js）
    if (to.path === FORBIDDEN_PATH) {
      return true;
    }

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return decodeURIComponent(
          (to.query?.redirect as string) ||
            userStore.userInfo?.homePath ||
            preferences.app.defaultHomePath,
        );
      }
      if (to.path === '/' && accessStore.accessToken) {
        if (hasSessionRoles() && accessStore.isAccessChecked) {
          return (
            userStore.userInfo?.homePath || preferences.app.defaultHomePath
          );
        }
        // 尚未生成菜单：不要放行走 Root 默认 redirect（数据总览）
      } else {
        if (
          (to.path === '/mlogin' || to.path === '/mobilelogin') &&
          accessStore.accessToken
        ) {
          return to.path === '/mobilelogin'
            ? '/mobileCloud/index'
            : '/mobile/index';
        }
        return true;
      }
    }

    // accessToken 检查（对齐旧站 getToken）
    if (!accessStore.accessToken) {
      if (to.meta.ignoreAccess) {
        return true;
      }

      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }
      return true;
    }

    // 对齐旧站：roles 已加载且路由已生成 → 直接放行
    // F5 后 roles 为空；登录成功后两者皆已就绪
    if (hasSessionRoles() && accessStore.isAccessChecked) {
      return true;
    }

    try {
      // roles 未加载：并行拉 config + islogin（对齐 permission.js）
      if (!hasSessionRoles()) {
        await authStore.initSession();
      }
      await authStore.generateAccessRoutes();

      const homePath =
        userStore.userInfo?.homePath || preferences.app.defaultHomePath;
      const isDefaultEntry =
        to.path === '/' || to.path === preferences.app.defaultHomePath;

      const redirectPath = (from.query.redirect ??
        (isDefaultEntry ? homePath : to.fullPath)) as string;

      return {
        ...router.resolve(decodeURIComponent(redirectPath)),
        replace: true,
      };
    } catch (error) {
      console.error('[accessGuard] init session failed', error);
      // 对齐旧站 FedLogOut → 回登录
      await authStore.logout(false);
      return {
        path: LOGIN_PATH,
        replace: true,
      };
    }
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
