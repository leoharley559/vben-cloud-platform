<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AppStoreWhitelistPanel from './components/appstore-whitelist-panel.vue';
import BankCardRiskPanel from './components/bank-card-risk-panel.vue';
import RegConfigPanel from './components/reg-config-panel.vue';
import RiskRecordPanel from './components/risk-record-panel.vue';

defineOptions({ name: 'GameRiskControl' });

const { checkPermission } = useCloudPermission();

const blacklistSubTab = ref('ip');
const whitelistSubTab = ref('ip');

const blacklistTabs = computed(() =>
  [
    {
      key: 'ip',
      kind: 'ip' as const,
      listType: 'blacklist' as const,
      permission: 11_412,
      tab: 'IP黑名单',
    },
    {
      key: 'bank',
      permission: 10_031,
      tab: '银行卡黑名单',
    },
    {
      key: 'device',
      kind: 'device' as const,
      listType: 'blacklist' as const,
      permission: 10_032,
      tab: '设备黑名单',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const whitelistTabs = computed(() =>
  [
    {
      key: 'ip',
      kind: 'ip' as const,
      listType: 'whitelist' as const,
      permission: 11_448,
      tab: 'IP白名单',
    },
    {
      key: 'device',
      kind: 'device' as const,
      listType: 'whitelist' as const,
      permission: 10_036,
      tab: '设备白名单',
    },
    {
      key: 'appstore',
      permission: 11_342,
      tab: 'App Store白名单',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const topTabs = computed(() =>
  [
    {
      key: 'blacklist',
      permission: 10_027,
      tab: '黑名单',
      visible: blacklistTabs.value.length > 0,
    },
    {
      key: 'whitelist',
      permission: 10_028,
      tab: '白名单',
      visible: whitelistTabs.value.length > 0,
    },
    {
      key: 'regconfig',
      permission: 12_973,
      tab: '注册上限配置',
      visible: checkPermission(12_973),
    },
  ].filter((item) => checkPermission(item.permission) && item.visible),
);

const canViewPage = computed(() => topTabs.value.length > 0);
const activeTab = ref('blacklist');

const activeBlacklist = computed(() =>
  blacklistTabs.value.find((item) => item.key === blacklistSubTab.value),
);
const activeWhitelist = computed(() =>
  whitelistTabs.value.find((item) => item.key === whitelistSubTab.value),
);

onMounted(() => {
  activeTab.value = topTabs.value[0]?.key || 'blacklist';
  blacklistSubTab.value = blacklistTabs.value[0]?.key || 'ip';
  whitelistSubTab.value = whitelistTabs.value[0]?.key || 'ip';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 游戏风控"
    title="游戏风控"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in topTabs" :key="item.key" :tab="item.tab">
          <template
            v-if="item.key === 'blacklist' && activeTab === 'blacklist'"
          >
            <div class="mb-3">
              <Radio.Group v-model:value="blacklistSubTab" button-style="solid">
                <Radio.Button
                  v-for="sub in blacklistTabs"
                  :key="sub.key"
                  :value="sub.key"
                >
                  {{ sub.tab }}
                </Radio.Button>
              </Radio.Group>
            </div>
            <RiskRecordPanel
              v-if="
                activeBlacklist &&
                (activeBlacklist.key === 'ip' ||
                  activeBlacklist.key === 'device') &&
                activeBlacklist.kind &&
                activeBlacklist.listType
              "
              :key="`black-${activeBlacklist.key}`"
              :kind="activeBlacklist.kind"
              :list-type="activeBlacklist.listType"
            />
            <BankCardRiskPanel v-else-if="activeBlacklist?.key === 'bank'" />
          </template>
          <template
            v-else-if="item.key === 'whitelist' && activeTab === 'whitelist'"
          >
            <div class="mb-3">
              <Radio.Group v-model:value="whitelistSubTab" button-style="solid">
                <Radio.Button
                  v-for="sub in whitelistTabs"
                  :key="sub.key"
                  :value="sub.key"
                >
                  {{ sub.tab }}
                </Radio.Button>
              </Radio.Group>
            </div>
            <RiskRecordPanel
              v-if="
                activeWhitelist &&
                (activeWhitelist.key === 'ip' ||
                  activeWhitelist.key === 'device') &&
                activeWhitelist.kind &&
                activeWhitelist.listType
              "
              :key="`white-${activeWhitelist.key}`"
              :kind="activeWhitelist.kind"
              :list-type="activeWhitelist.listType"
            />
            <AppStoreWhitelistPanel
              v-else-if="activeWhitelist?.key === 'appstore'"
            />
          </template>
          <RegConfigPanel
            v-else-if="item.key === 'regconfig' && activeTab === 'regconfig'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无游戏风控查看权限" title="403" />
</template>
