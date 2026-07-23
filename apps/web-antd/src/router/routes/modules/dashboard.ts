import type { RouteRecordRaw } from 'vue-router';

/**
 * 数据总览：登录默认首页。
 * hideInMenu：不占左侧「概览」菜单；业务入口由后端 Nav 提供。
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      affixTab: true,
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
