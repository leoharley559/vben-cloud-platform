<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';
import { hasOperationalDataRole } from '#/utils/operational-data';

import DailyReportPanel from './components/daily-report-panel.vue';
import DeviceDailyPanel from './components/device-daily-panel.vue';
import PackageDailyPanel from './components/package-daily-panel.vue';
import VipDailyPanel from './components/vip-daily-panel.vue';

defineOptions({ name: 'EverydayData' });

const { checkPermission } = useCloudPermission();

/** 对齐旧站 everydayData.vue：按 SubMenu + HaveFunction 控制 Tab，不再整页注释隐藏 */
const tabs = computed(() =>
  [
    {
      component: DailyReportPanel,
      key: 'dayReport',
      show: checkPermission(10_688) && hasOperationalDataRole('1'),
      tab: '日报',
    },
    {
      component: PackageDailyPanel,
      key: 'packageDaily',
      show: checkPermission(10_689) && hasOperationalDataRole('2'),
      tab: '上架包日报',
    },
    {
      component: DeviceDailyPanel,
      key: 'deviceDaily',
      show: checkPermission(12_160),
      tab: '设备日报',
    },
    {
      component: VipDailyPanel,
      key: 'vipDaily',
      show: checkPermission(12_450),
      tab: 'VIP日报',
    },
  ].filter((item) => item.show),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('dayReport');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'dayReport';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="数据汇总 · 公司日报"
    title="公司日报"
  >
    <Card size="small">
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无公司日报查看权限" title="403" />
</template>
