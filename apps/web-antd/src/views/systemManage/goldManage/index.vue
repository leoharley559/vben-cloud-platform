<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GoldInventoryPanel from './components/gold-inventory-panel.vue';
import GoldSellPanel from './components/gold-sell-panel.vue';
import GoldSellRecordPanel from './components/gold-sell-record-panel.vue';

defineOptions({ name: 'GoldManage' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('inventory');
/** 授信页「查看记录」传入的包网账号 */
const recordAgentName = ref('');

const tabs = computed(() =>
  [
    {
      key: 'inventory',
      permission: 11_423,
      tab: '库存',
    },
    {
      key: 'sell',
      permission: 11_424,
      tab: '授信',
    },
    {
      key: 'record',
      permission: 11_425,
      tab: '授信记录',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

function openSellRecord(agentName: string) {
  recordAgentName.value = agentName || '';
  activeTab.value = 'record';
}

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'inventory';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="系统管理 · 金币管理"
    title="金币管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <GoldInventoryPanel
            v-if="item.key === 'inventory' && activeTab === 'inventory'"
          />
          <GoldSellPanel
            v-else-if="item.key === 'sell' && activeTab === 'sell'"
            @look-record="openSellRecord"
          />
          <GoldSellRecordPanel
            v-else-if="item.key === 'record' && activeTab === 'record'"
            :agent-name="recordAgentName"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无金币管理查看权限" title="403" />
</template>
