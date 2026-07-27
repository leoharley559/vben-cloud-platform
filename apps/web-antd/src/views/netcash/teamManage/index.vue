<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import TeamListPanel from './components/team-list-panel.vue';
import TeamRecordPanel from './components/team-record-panel.vue';

defineOptions({ name: 'TeamManage' });

const { checkPermission } = useCloudPermission();
const canEnterManage = computed(() => checkPermission(11_487));
const canViewRecord = computed(() => checkPermission(11_496));
const canViewPage = computed(() => canEnterManage.value || canViewRecord.value);

const activeTab = ref(
  canEnterManage.value ? 'manage' : canViewRecord.value ? 'record' : '',
);
</script>

<template>
  <Page v-if="canViewPage" auto-content-height description="代理网赚 · 团队管理" title="团队管理">
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canEnterManage" key="manage" tab="团队列表">
          <TeamListPanel v-if="activeTab === 'manage'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canViewRecord" key="record" tab="操作记录">
          <TeamRecordPanel v-if="activeTab === 'record'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无团队管理查看权限" title="403" />
</template>
