<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelDataList from './components/channel-data-list.vue';
import ChannelRecoupList from './components/channel-recoup-list.vue';
import DataWriteList from './components/data-write-list.vue';
import DropChangeList from './components/drop-change-list.vue';
import InvalidUserPanel from './components/invalid-user-panel.vue';

defineOptions({ name: 'PromoteData' });

const { checkPermission } = useCloudPermission();

const canAccountData = computed(() => checkPermission(10886));
const canDropChange = computed(() => checkPermission(10887));
const canInvalidUser = computed(() => checkPermission(10888));
const canDataWrite = computed(() => checkPermission(10889));
const canChannelRecoup = computed(() => checkPermission(13187));

const canViewPage = computed(
  () =>
    canAccountData.value ||
    canDropChange.value ||
    canInvalidUser.value ||
    canDataWrite.value ||
    canChannelRecoup.value,
);

const activeTab = ref('account');

function resolveDefaultTab() {
  const tabs = [
    { key: 'account', visible: canAccountData.value },
    { key: 'drop', visible: canDropChange.value },
    { key: 'invalid', visible: canInvalidUser.value },
    { key: 'write', visible: canDataWrite.value },
    { key: 'recoup', visible: canChannelRecoup.value },
  ];
  activeTab.value = tabs.find((item) => item.visible)?.key || 'account';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 推广报表"
    title="推广报表"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canAccountData" key="account" tab="账户数据">
          <ChannelDataList v-if="activeTab === 'account'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canDropChange" key="drop" tab="落地页转化">
          <DropChangeList v-if="activeTab === 'drop'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canInvalidUser" key="invalid" tab="无效用户">
          <InvalidUserPanel v-if="activeTab === 'invalid'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canDataWrite" key="write" tab="数据填写">
          <DataWriteList v-if="activeTab === 'write'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canChannelRecoup" key="recoup" tab="渠道回本数据">
          <ChannelRecoupList v-if="activeTab === 'recoup'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无推广报表查看权限" title="403" />
</template>
