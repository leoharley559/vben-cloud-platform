<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import EmailCodeQueryList from './components/email-code-query-list.vue';
import EmailOutgoingAccountList from './components/email-outgoing-account-list.vue';
import MobileAreaCodeList from './components/mobile-area-code-list.vue';
import MobileCodeQueryList from './components/mobile-code-query-list.vue';
import OtpManagePanel from './components/otp-manage-panel.vue';

defineOptions({ name: 'VerifyCodeManage' });

const { checkPermission } = useCloudPermission();

const canMobileCode = computed(() => checkPermission(10_026));
const canAreaCode = computed(() => checkPermission(11_921));
const canEmailCode = computed(() => checkPermission(13_011));
const canEmailChannel = computed(() => checkPermission(13_089));
const canOtpManage = computed(() => checkPermission(13_204));

const canViewAny = computed(
  () =>
    canMobileCode.value ||
    canAreaCode.value ||
    canEmailCode.value ||
    canEmailChannel.value ||
    canOtpManage.value,
);

const activeTab = ref('mobileCode');

function resolveDefaultTab() {
  const tabs = [
    { key: 'mobileCode', visible: canMobileCode.value },
    { key: 'areaCode', visible: canAreaCode.value },
    { key: 'emailCode', visible: canEmailCode.value },
    { key: 'emailChannel', visible: canEmailChannel.value },
    { key: 'otpManage', visible: canOtpManage.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'mobileCode';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="会员管理 · 验证码查询"
    title="验证码查询"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane
          v-if="canMobileCode"
          key="mobileCode"
          tab="手机验证码查询"
        >
          <MobileCodeQueryList v-if="activeTab === 'mobileCode'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canAreaCode" key="areaCode" tab="手机区码管理">
          <MobileAreaCodeList v-if="activeTab === 'areaCode'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canEmailCode" key="emailCode" tab="邮箱验证码查询">
          <EmailCodeQueryList v-if="activeTab === 'emailCode'" />
        </Tabs.TabPane>
        <Tabs.TabPane
          v-if="canEmailChannel"
          key="emailChannel"
          tab="邮箱通道配置"
        >
          <EmailOutgoingAccountList v-if="activeTab === 'emailChannel'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canOtpManage" key="otpManage" tab="OTP 管理">
          <OtpManagePanel v-if="activeTab === 'otpManage'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无验证码查询权限" title="403" />
</template>
