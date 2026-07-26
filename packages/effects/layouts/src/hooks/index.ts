import type { VNode } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';

import { computed } from 'vue';

import { preferences, usePreferences } from '@vben/preferences';

/**
 * 转换组件，自动添加 name
 * @param component
 * @param route
 */
export function transformComponent(
  component: VNode,
  route: RouteLocationNormalizedLoadedGeneric,
) {
  // 组件视图未找到，如果有设置后备视图，则返回后备视图，如果没有，则抛出错误
  if (!component) {
    console.error(
      'Component view not found，please check the route configuration',
    );
    return undefined;
  }

  const routeName = route.name as string;
  // 没有路由名时无法对齐 KeepAlive include，原样返回
  if (!routeName) {
    return component;
  }
  const componentName = (component?.type as any)?.name;

  // KeepAlive 的 include 用的是 route.name；已对齐则无需再改
  if (componentName === routeName) {
    return component;
  }

  // 动态菜单路由名形如 agencyAccountDetails_284，页面 defineOptions 常是
  // AgencyAccountDetails，名称不一致会导致离开页时不被缓存却仍走 Transition，
  // 与 Tabs/异步更新叠加后出现 insertBefore / parentNode 报错
  component.type ||= {};
  (component.type as any).name = routeName;

  return component;
}

/**
 * Layout相关hook
 */
export function useLayoutHook() {
  const { keepAlive } = usePreferences();
  /**
   * 是否使用动画
   */
  const getEnabledTransition = computed(() => {
    const { transition } = preferences;
    const transitionName = transition.name;
    return transitionName && transition.enable;
  });

  /**
   * 获取路由过渡动画
   * @param _route
   */
  function getTransitionName(_route: RouteLocationNormalizedLoaded) {
    // 如果偏好设置未设置，则不使用动画
    const { tabbar, transition } = preferences;
    const transitionName = transition.name;
    if (!transitionName || !transition.enable) {
      return;
    }

    // 标签页未启用或者未开启缓存，则使用全局配置动画
    if (!tabbar.enable || !keepAlive) {
      return transitionName;
    }

    // 如果页面已经加载过，则不使用动画
    // if (route.meta.loaded) {
    //   return;
    // }
    // 已经打开且已经加载过的页面不使用动画
    // const inTabs = getCachedTabs.value.includes(route.name as string);

    // return inTabs && route.meta.loaded ? undefined : transitionName;
    return transitionName;
  }

  return {
    getEnabledTransition,
    getTransitionName,
  };
}
