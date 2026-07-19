<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AgencyList from './components/agency-list.vue';
import AreamaskingPanel from './components/areamasking-panel.vue';
import DeveloperList from './components/developer-list.vue';
import RegisterList from './components/register-list.vue';

defineOptions({ name: 'Agency' });

const { checkPermission } = useCloudPermission();

const canAgencyList = computed(() => checkPermission(10083));
const canRegisterList = computed(() => checkPermission(10084));
const canAreaMasking = computed(() => checkPermission(11571));
const canDeveloperList = computed(() => checkPermission(12169));
const canViewPage = computed(
  () =>
    canAgencyList.value ||
    canRegisterList.value ||
    canAreaMasking.value ||
    canDeveloperList.value,
);

const activeTab = ref('agency');

function resolveDefaultTab() {
  if (canAgencyList.value) {
    activeTab.value = 'agency';
    return;
  }
  if (canRegisterList.value) {
    activeTab.value = 'register';
    return;
  }
  if (canAreaMasking.value) {
    activeTab.value = 'area';
    return;
  }
  if (canDeveloperList.value) {
    activeTab.value = 'developer';
  }
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理管理"
    title="代理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canAgencyList" key="agency" tab="代理列表">
          <AgencyList v-if="activeTab === 'agency'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canRegisterList" key="register" tab="注册列表">
          <RegisterList v-if="activeTab === 'register'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canAreaMasking" key="area" tab="区域屏蔽">
          <AreamaskingPanel v-if="activeTab === 'area'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canDeveloperList" key="developer" tab="发展人列表">
          <DeveloperList v-if="activeTab === 'developer'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理管理查看权限" title="403" />
</template>
