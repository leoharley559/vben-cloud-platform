<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchBackWaterRecordListApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { backWaterRecordColumns } from '../shared/columns';
import BackWaterHandPanel from './components/back-water-hand-panel.vue';
import BackWaterReviewPanel from './components/back-water-review-panel.vue';
import BackWaterSchemePanel from './components/back-water-scheme-panel.vue';

defineOptions({ name: 'BackWater' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('config');

const tabs = computed(() =>
  [
    {
      key: 'config',
      permission: 11073,
      tab: '返水配置',
    },
    {
      config: {
        columns: backWaterRecordColumns,
        fetchApi: fetchBackWaterRecordListApi,
        filters: ['login', 'date'],
      } satisfies OperationListConfig,
      key: 'record',
      permission: 11074,
      tab: '返水记录',
    },
    {
      key: 'hand',
      permission: 11075,
      tab: '手动返水',
    },
    {
      key: 'audit',
      permission: 11076,
      tab: '返水审核',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'config';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 返水设置"
    title="返水设置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <BackWaterReviewPanel
            v-if="item.key === 'audit' && activeTab === 'audit'"
          />
          <BackWaterSchemePanel
            v-else-if="item.key === 'config' && activeTab === 'config'"
          />
          <BackWaterHandPanel
            v-else-if="item.key === 'hand' && activeTab === 'hand'"
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
  <Result v-else status="403" sub-title="无返水设置查看权限" title="403" />
</template>
