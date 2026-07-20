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
  {
    meta: {
      activePath: '/gameManage/backWater',
      hideInMenu: true,
      title: 'VIP 返水配置',
    },
    name: 'BackWaterAddConfig',
    path: '/gameManage/backWater/addConfig',
    component: () =>
      import('#/views/gameManage/backWater/addConfig/index.vue'),
  },
  {
    meta: {
      activePath: '/generalizeManage/generalizeManageact',
      hideInMenu: true,
      title: '新增/编辑渠道推广',
    },
    name: 'AddGeneralize',
    path: '/generalizeManage/addGeneralize',
    component: () =>
      import('#/views/generalizeManage/addGeneralize/index.vue'),
  },
  {
    meta: {
      activePath: '/generalizeManage/generalizeManageact',
      hideInMenu: true,
      title: '新增下级代理',
    },
    name: 'AddPromote',
    path: '/generalizeManage/addPromote',
    component: () =>
      import('#/views/generalizeManage/addPromote/index.vue'),
  },
];

export default routes;
