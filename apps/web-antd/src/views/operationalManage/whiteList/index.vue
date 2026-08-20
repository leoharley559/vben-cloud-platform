<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { fetchWhiteListStatsApi } from '#/api/operationManage/white-list';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import WhiteListPanel from './components/white-list-panel.vue';

defineOptions({ name: 'WhiteList' });

const { checkPermission } = useCloudPermission();

/**
 * 对齐旧站 whiteSetting.vue 内层 Tab：
 * IP白名单 10214 / 使用者 10215
 * （外层「白名单设置」10207 在旧站仅作壳，NEW 直接展示内层）
 */
const tabs = computed(() =>
  [
    {
      key: 'ip',
      permission: 10_214,
      tab: 'IP白名单',
    },
    {
      key: 'user',
      permission: 10_215,
      tab: '使用者列表',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('ip');
/** 使用者点击名称跳转 IP 列表时带入 WhiteUsername */
const pendingWhiteUsername = ref('');

const stats = ref({ IpList: 0, UserList: 0 });
const canIpStats = computed(() => checkPermission(10_214));
const canUserStats = computed(() => checkPermission(10_215));

const summaryItems = computed(() => [
  ...(canIpStats.value ? [{ label: 'IP总计', value: stats.value.IpList }] : []),
  ...(canUserStats.value
    ? [{ label: '使用者', value: stats.value.UserList }]
    : []),
]);

async function loadStats() {
  try {
    const data = await fetchWhiteListStatsApi();
    stats.value = {
      IpList: Number(data?.IpList ?? 0),
      UserList: Number(data?.UserList ?? 0),
    };
  } catch {
    stats.value = { IpList: 0, UserList: 0 };
  }
}

function handleJumpToIpByUser(name: string) {
  pendingWhiteUsername.value = name;
  if (tabs.value.some((item) => item.key === 'ip')) {
    activeTab.value = 'ip';
  }
}

function clearPendingWhiteUsername() {
  pendingWhiteUsername.value = '';
}

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'ip';
  void loadStats();
});

watch(activeTab, (key) => {
  if (key !== 'ip') {
    pendingWhiteUsername.value = '';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 白名单设置"
    title="白名单"
  >
    <Card>
      <SummaryCards :items="summaryItems" />
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <WhiteListPanel
            v-if="activeTab === item.key"
            :mode="item.key as 'ip' | 'user'"
            :initial-white-username="
              item.key === 'ip' ? pendingWhiteUsername : ''
            "
            @jump-to-ip="handleJumpToIpByUser"
            @consumed-username="clearPendingWhiteUsername"
            @changed="loadStats"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无白名单查看权限" title="403" />
</template>
