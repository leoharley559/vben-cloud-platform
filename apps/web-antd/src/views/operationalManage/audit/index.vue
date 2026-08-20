<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BonusAuditPanel from './components/bonus-audit-panel.vue';
import BonusRecordList from './components/bonus-record-list.vue';
import MatchRecordList from './components/match-record-list.vue';
import PlatformTransferList from './components/platform-transfer-list.vue';

defineOptions({ name: 'OperationalBonusManage' });

const { checkPermission } = useCloudPermission();

const canBonusAudit = computed(
  () => checkPermission(10_112) || checkPermission(11_968),
);
const canBonusRecord = computed(() => checkPermission(10_114));
const canMatchRecord = computed(() => checkPermission(11_658));
const canPlatformTransfer = computed(() => checkPermission(10_116));

const canViewAny = computed(
  () =>
    canBonusAudit.value ||
    canBonusRecord.value ||
    canMatchRecord.value ||
    canPlatformTransfer.value,
);

const activeTab = ref('bonusAudit');

function resolveDefaultTab() {
  const tabs = [
    { key: 'bonusAudit', visible: canBonusAudit.value },
    { key: 'bonusRecord', visible: canBonusRecord.value },
    { key: 'matchRecord', visible: canMatchRecord.value },
    { key: 'platformTransfer', visible: canPlatformTransfer.value },
  ];
  const first = tabs.find((item) => item.visible);
  activeTab.value = first?.key || 'bonusAudit';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="运营管理 · 红利管理"
    title="红利管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canBonusAudit" key="bonusAudit" tab="红利审核">
          <BonusAuditPanel v-if="activeTab === 'bonusAudit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canBonusRecord" key="bonusRecord" tab="红利记录">
          <BonusRecordList v-if="activeTab === 'bonusRecord'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canMatchRecord" key="matchRecord" tab="申请记录">
          <MatchRecordList v-if="activeTab === 'matchRecord'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canPlatformTransfer"
          key="platformTransfer"
          tab="平台转账"
        >
          <PlatformTransferList v-if="activeTab === 'platformTransfer'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="红利管理">
    <Result
      status="403"
      sub-title="需要红利管理相关权限才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
