<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Tabs } from 'ant-design-vue';

import AuthAuditList from './components/auth-audit-list.vue';
import AuthRecordList from './components/auth-record-list.vue';
import AuthSettingPanel from './components/auth-setting-panel.vue';

defineOptions({ name: 'PlayerAuthenticationManage' });

const activeTab = ref('auditList');
</script>

<template>
  <Page auto-content-height description="会员管理 · 身份验证" title="身份验证">
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane key="auditList" tab="审核列表">
          <AuthAuditList v-if="activeTab === 'auditList'" />
        </Tabs.TabPane>
        <Tabs.TabPane key="auditRecord" tab="审核记录">
          <AuthRecordList v-if="activeTab === 'auditRecord'" />
        </Tabs.TabPane>
        <Tabs.TabPane key="auditSetting" tab="验证设置">
          <AuthSettingPanel v-if="activeTab === 'auditSetting'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
