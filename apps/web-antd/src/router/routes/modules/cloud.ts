import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      icon: 'lucide:construction',
      title: '页面待迁移',
    },
    name: 'CloudPlaceholder',
    path: '/cloud/placeholder',
    component: () => import('#/views/cloud/placeholder/index.vue'),
  },
  {
    meta: {
      hideInMenu: true,
      title: '玩家详情',
    },
    name: 'OperationalPlayerDetails',
    path: '/operationalManage/playerDetails/:id',
    component: () =>
      import('#/views/operationalManage/playerDetails/index.vue'),
  },
];

export default routes;
