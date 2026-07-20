<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

import TeamDailyPanel from './components/team-daily-panel.vue';

defineOptions({ name: 'TeamDaily' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const teamType = computed(() => {
  const info = projectConfig.value?.AccountTeamInfo as
    | undefined
    | { TeamType?: number };
  return Number(info?.TeamType || 0);
});

const canWithdrawTab = computed(() => checkPermission(10_868));
const canProfitTab = computed(() => checkPermission(10_869));
const canViewPage = computed(
  () =>
    teamType.value === 1 ||
    teamType.value === 2 ||
    canWithdrawTab.value ||
    canProfitTab.value,
);

const activeTab = ref('withdraw');

function resolveDefaultTab() {
  if (teamType.value === 1) {
    activeTab.value = 'withdraw';
    return;
  }
  if (teamType.value === 2) {
    activeTab.value = 'profit';
    return;
  }
  const tabs = [
    { key: 'withdraw', visible: canWithdrawTab.value },
    { key: 'profit', visible: canProfitTab.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'withdraw';
}

onMounted(() => {
  resolveDefaultTab();
});

watch(
  [teamType, canWithdrawTab, canProfitTab],
  () => resolveDefaultTab(),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 代理日报表"
    title="代理日报表"
  >
    <Card class="team-daily-card" :bordered="false">
      <TeamDailyPanel v-if="teamType === 1" :team-type="1" />
      <TeamDailyPanel v-else-if="teamType === 2" :team-type="2" />
      <Tabs v-else v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canWithdrawTab" key="withdraw" tab="提现模式">
          <KeepAlive>
            <TeamDailyPanel v-if="activeTab === 'withdraw'" :team-type="1" />
          </KeepAlive>
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canProfitTab" key="profit" tab="利润模式">
          <KeepAlive>
            <TeamDailyPanel v-if="activeTab === 'profit'" :team-type="2" />
          </KeepAlive>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理日报表查看权限" title="403" />
</template>

<style scoped>
.team-daily-card {
  min-height: calc(100vh - 180px);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
}
</style>
