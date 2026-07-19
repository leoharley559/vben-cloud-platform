<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ActivityAppointmentPanel from './components/activity-appointment-panel.vue';
import ActivityBeginnerTurntablePanel from './components/activity-beginner-turntable-panel.vue';
import ActivityBonusWithdrawPanel from './components/activity-bonus-withdraw-panel.vue';
import ActivityDailyCheckinPanel from './components/activity-daily-checkin-panel.vue';
import ActivityDepositPromoPanel from './components/activity-deposit-promo-panel.vue';
import ActivityInvitePanel from './components/activity-invite-panel.vue';
import ActivityOngoingPanel from './components/activity-ongoing-panel.vue';
import ActivityPlayerAgentPanel from './components/activity-player-agent-panel.vue';
import ActivityPromoCodePanel from './components/activity-promo-code-panel.vue';
import ActivityRecordsPanel from './components/activity-records-panel.vue';
import ActivityTemplatePanel from './components/activity-template-panel.vue';
import ActivityVipPanel from './components/activity-vip-panel.vue';
import JackpotDisplayPanel from './components/jackpot-display-panel.vue';

defineOptions({ name: 'Activity' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      component: ActivityOngoingPanel,
      key: 'ongoing',
      permission: 10298,
      tab: '当前活动',
    },
    {
      component: ActivityTemplatePanel,
      key: 'template',
      permission: 10299,
      tab: '活动模版',
    },
    {
      component: ActivityRecordsPanel,
      key: 'records',
      permission: 10300,
      tab: '活动记录',
    },
    {
      component: ActivityVipPanel,
      key: 'vip',
      permission: 10302,
      tab: 'VIP特权',
    },
    {
      component: ActivityPromoCodePanel,
      key: 'promoCode',
      permission: 13208,
      tab: '优惠码',
    },
    {
      component: ActivityDailyCheckinPanel,
      key: 'dailyCheckIn',
      permission: 13245,
      tab: '每日签到',
    },
    {
      component: ActivityInvitePanel,
      key: 'invite',
      permission: 10303,
      tab: '邀请好友',
    },
    {
      component: ActivityPlayerAgentPanel,
      key: 'playerAgent',
      permission: 12624,
      tab: '会员代理',
    },
    {
      component: ActivityDepositPromoPanel,
      key: 'depositPromo',
      permission: 10304,
      tab: '存款优惠',
    },
    {
      component: ActivityBeginnerTurntablePanel,
      key: 'beginnerTurntable',
      permission: 13169,
      tab: '新手转盘',
    },
    {
      component: ActivityAppointmentPanel,
      key: 'appointmentWithdraw',
      permission: 11910,
      tab: '预约取款',
    },
    {
      component: ActivityBonusWithdrawPanel,
      key: 'bonusWithdraw',
      permission: 12395,
      tab: '确认到账',
    },
    {
      component: JackpotDisplayPanel,
      key: 'jackpot',
      permission: 12657,
      tab: '滚动大奖',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('ongoing');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'ongoing';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 活动设置"
    title="活动设置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无活动设置查看权限" title="403" />
</template>
