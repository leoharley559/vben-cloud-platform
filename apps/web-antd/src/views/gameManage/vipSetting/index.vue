<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Empty, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import VipCoefficientPanel from './components/vip-coefficient-panel.vue';
import VipGradePanel from './components/vip-grade-panel.vue';
import VipIconPanel from './components/vip-icon-panel.vue';
import VipRecordPanel from './components/vip-record-panel.vue';

defineOptions({ name: 'VipSetting' });

const route = useRoute();
const { checkPermission } = useCloudPermission();
const tabs = computed(() =>
  [
    {
      component: VipGradePanel,
      key: 'first',
      label: 'VIP 等级',
      permission: 10_963,
    },
    {
      component: VipCoefficientPanel,
      key: 'second',
      label: 'VIP 升级系数',
      permission: 10_964,
    },
    {
      component: VipRecordPanel,
      key: 'third',
      label: 'VIP 等级记录',
      permission: 10_965,
    },
    {
      component: VipIconPanel,
      key: 'vipIcon',
      label: 'VIP 图标配置',
      permission: 13_156,
    },
  ].filter((item) => checkPermission(item.permission)),
);
const routeType = String(route.query.type || '');
const activeKey = ref(
  tabs.value.some((item) => item.key === routeType)
    ? routeType
    : tabs.value[0]?.key || '',
);
</script>

<template>
  <Page auto-content-height description="游戏管理 · VIP设置" title="VIP设置">
    <Card v-if="tabs.length > 0" size="small">
      <Tabs
        v-model:active-key="activeKey"
        destroy-inactive-tab-pane
        type="line"
        size="small"
      >
        <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
          <component :is="tab.component" v-if="activeKey === tab.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
    <Card v-else size="small">
      <Empty description="暂无 VIP 设置页面权限" />
    </Card>
  </Page>
</template>
