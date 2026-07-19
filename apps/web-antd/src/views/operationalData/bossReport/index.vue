<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchBossEmployeeStatsApi } from '#/api/operationalData/boss-report';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '../../operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '../../operationalManage/components/operation-list-panel.vue';
import { bossEmployeeColumns } from '../shared/columns';

defineOptions({ name: 'BossReport' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() => [
  {
    config: {
      columns: bossEmployeeColumns,
      dateFieldKeys: { begin: 'TimeNumber' },
      dateMode: 'single',
      datePreset: 'yesterday',
      dateValueFormat: 'unix',
      fetchApi: fetchBossEmployeeStatsApi,
      filters: ['date'],
    } satisfies OperationListConfig,
    key: 'employee',
    tab: '员工业务统计',
  },
]);

const canViewPage = computed(() => checkPermission(10715));
const activeTab = ref('employee');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'employee';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 老板日报"
    title="老板日报"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        今日统计卡片、趋势图、平台汇总等待下一迭代迁移。
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <OperationListPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无老板日报查看权限" title="403" />
</template>
