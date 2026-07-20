<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

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
  <div class="vip-setting-page">
    <Card v-if="tabs.length > 0" :bordered="false" class="tabs-card">
      <Tabs v-model:active-key="activeKey" destroy-inactive-tab-pane>
        <Tabs.TabPane
          v-for="tab in tabs"
          :key="tab.key"
          :tab="tab.label"
        >
          <component :is="tab.component" v-if="activeKey === tab.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
    <Card v-else :bordered="false">
      <Empty description="暂无 VIP 设置页面权限" />
    </Card>
  </div>
</template>

<style scoped>
.vip-setting-page {
  min-height: 100%;
  padding: 16px;
}

.tabs-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

:deep(.ant-card-body) {
  padding-top: 8px;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}
</style>
