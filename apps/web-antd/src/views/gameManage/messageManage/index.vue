<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import SmsChannelPanel from './components/sms-channel-panel.vue';
import SmsMonthlyPanel from './components/sms-monthly-panel.vue';
import SmsOtpPanel from './components/sms-otp-panel.vue';
import SmsOverviewPanel from './components/sms-overview-panel.vue';
import SmsRecallPanel from './components/sms-recall-panel.vue';
import SmsTemplatePanel from './components/sms-template-panel.vue';

defineOptions({ name: 'MessageManage' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('overview');

const tabs = computed(() =>
  [
    { key: 'overview', permission: 10_930, tab: '短信总览' },
    { key: 'month', permission: 10_931, tab: '月度统计' },
    { key: 'channel', permission: 12_906, tab: '通道配置' },
    { key: 'template', permission: 13_239, tab: '短信模板' },
    { key: 'otp', permission: 13_372, tab: '注册 OTP 明细' },
    { key: 'regRecall', permission: 13_408, tab: '注册次日召回' },
    { key: 'depositRecall', permission: 13_414, tab: '首存次日召回' },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

watchEffect(() => {
  if (!tabs.value.some((item) => item.key === activeTab.value)) {
    activeTab.value = tabs.value[0]?.key || '';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="维护短信余额、统计、通道、模板、注册 OTP 与用户召回"
    title="短信管理"
  >
    <Card class="message-manage-card" :bordered="false">
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <SmsOverviewPanel
            v-if="item.key === 'overview' && activeTab === 'overview'"
          />
          <SmsMonthlyPanel
            v-else-if="item.key === 'month' && activeTab === 'month'"
          />
          <SmsChannelPanel
            v-else-if="item.key === 'channel' && activeTab === 'channel'"
          />
          <SmsTemplatePanel
            v-else-if="item.key === 'template' && activeTab === 'template'"
          />
          <SmsOtpPanel
            v-else-if="item.key === 'otp' && activeTab === 'otp'"
          />
          <SmsRecallPanel
            v-else-if="
              item.key === 'regRecall' && activeTab === 'regRecall'
            "
            type="register"
          />
          <SmsRecallPanel
            v-else-if="
              item.key === 'depositRecall' && activeTab === 'depositRecall'
            "
            type="deposit"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无短信管理查看权限" title="403" />
</template>

<style scoped>
.message-manage-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(15 23 42 / 6%);
}
</style>
