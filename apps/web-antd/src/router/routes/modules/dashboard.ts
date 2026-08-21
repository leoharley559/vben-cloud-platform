import type { RouteRecordRaw } from 'vue-router';

/**
 * 数据总览：由后端 Nav 决定是否出现在左侧菜单。
 * 登录后的默认页是账号有权限的第一个菜单，不是固定本页。
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      icon: 'lucide:layout-dashboard',
      title: '数据总览',
    },
    name: 'DashboardIndex',
    path: '/dashboard/index',
    component: () => import('#/views/dashboard/index/index.vue'),
  },
];

export default routes;
