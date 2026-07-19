<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchVipLevelListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { vipLevelColumns } from '../shared/columns';
import VipGradePanel from './components/vip-grade-panel.vue';
import VipIconPanel from './components/vip-icon-panel.vue';
import VipUpgradeFactorPanel from './components/vip-upgrade-factor-panel.vue';

defineOptions({ name: 'VipSetting' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('grade');

const tabs = computed(() =>
  [
    {
      key: 'grade',
      permission: 10963,
      tab: 'VIP等级',
    },
    {
      key: 'factor',
      permission: 10964,
      tab: '升级系数',
    },
    {
      config: {
        columns: vipLevelColumns,
        fetchApi: fetchVipLevelListApi,
        filters: ['login'],
      } satisfies OperationListConfig,
      key: 'record',
      permission: 10965,
      tab: '等级纪录',
    },
    {
      key: 'icon',
      permission: 13156,
      tab: 'VIP图标',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'grade';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · VIP设置"
    title="VIP设置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <VipGradePanel v-if="item.key === 'grade' && activeTab === 'grade'" />
          <VipUpgradeFactorPanel
            v-else-if="item.key === 'factor' && activeTab === 'factor'"
          />
          <VipIconPanel
            v-else-if="item.key === 'icon' && activeTab === 'icon'"
          />
          <template v-else>
            <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
              {{ item.tip }}
            </div>
            <OperationListPanel
              v-if="activeTab === item.key && item.config"
              :config="item.config"
            />
          </template>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无VIP设置查看权限" title="403" />
</template>
