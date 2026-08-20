<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import CommissionLedgerPanel from './components/commission-ledger-panel.vue';
import SchemePanel from './components/scheme-panel.vue';

defineOptions({ name: 'CommissionManage' });

const { checkPermission } = useCloudPermission();

type SchemeMode = 'algorithm' | 'multi' | 'single' | 'venue';
interface TopTab {
  component: 'grant' | 'record' | 'scheme';
  key: string;
  mode?: SchemeMode;
  permission: number;
  tab: string;
}

const tabs = computed<TopTab[]>(() =>
  (
    [
      {
        component: 'scheme',
        key: 'single',
        mode: 'single',
        permission: 10_201,
        tab: '单层佣金方案',
      },
      {
        component: 'scheme',
        key: 'multi',
        mode: 'multi',
        permission: 12_539,
        tab: '多层（多费率）佣金方案',
      },
      {
        component: 'scheme',
        key: 'venue',
        mode: 'venue',
        permission: 10_202,
        tab: '场馆费率',
      },
      {
        component: 'grant',
        key: 'grant',
        permission: 10_203,
        tab: '发放佣金',
      },
      {
        component: 'record',
        key: 'record',
        permission: 11_478,
        tab: '佣金记录',
      },
      {
        component: 'scheme',
        key: 'algorithm',
        mode: 'algorithm',
        permission: 10_204,
        tab: '佣金算法设置',
      },
    ] as TopTab[]
  ).filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('single');
const grantTab = ref('personal');
const recordTab = ref('personal');

const subTabs = [
  { key: 'personal', permission: 10_255, tab: '个人佣金', variant: 'personal' },
  { key: 'team', permission: 10_256, tab: '团队佣金', variant: 'team' },
  {
    key: 'multi-single',
    permission: 10_256,
    tab: '多层（单费率）佣金',
    variant: 'multi-single',
  },
  {
    key: 'multi-multi',
    permission: 10_256,
    tab: '多层（多费率）佣金',
    variant: 'multi-multi',
  },
] as const;

const grantSubTabs = computed(() =>
  subTabs.filter((item) => checkPermission(item.permission)),
);
/** 记录子 Tab：个人/多层单费率 → 11479；团队/多层多费率 → 11480（对齐旧站） */
const recordSubTabs = computed(() =>
  subTabs.filter((item) =>
    checkPermission(
      item.variant === 'personal' || item.variant === 'multi-single'
        ? 11_479
        : 11_480,
    ),
  ),
);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'single';
  grantTab.value = grantSubTabs.value[0]?.key || 'personal';
  recordTab.value = recordSubTabs.value[0]?.key || 'personal';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 佣金管理"
    title="佣金管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <SchemePanel
            v-if="activeTab === item.key && item.component === 'scheme'"
            :mode="item.mode || 'single'"
          />
          <Tabs
            v-else-if="activeTab === 'grant' && item.component === 'grant'"
            v-model:active-key="grantTab"
            type="line"
            size="small"
          >
            <Tabs.TabPane
              v-for="sub in grantSubTabs"
              :key="sub.key"
              :tab="sub.tab"
            >
              <CommissionLedgerPanel
                v-if="grantTab === sub.key"
                context="grant"
                :variant="sub.variant"
              />
            </Tabs.TabPane>
          </Tabs>
          <Tabs
            v-else-if="activeTab === 'record' && item.component === 'record'"
            v-model:active-key="recordTab"
            type="line"
            size="small"
          >
            <Tabs.TabPane
              v-for="sub in recordSubTabs"
              :key="sub.key"
              :tab="sub.tab"
            >
              <CommissionLedgerPanel
                v-if="recordTab === sub.key"
                context="record"
                :variant="sub.variant"
              />
            </Tabs.TabPane>
          </Tabs>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无佣金管理查看权限" title="403" />
</template>
