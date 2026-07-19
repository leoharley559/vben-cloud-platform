<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AdjustAuditList from './components/adjust-audit-list.vue';
import AdjustFormPanel from './components/adjust-form.vue';
import AdjustRecordList from './components/adjust-record-list.vue';

defineOptions({ name: 'OperationalAccountAdjust' });

const { checkPermission } = useCloudPermission();

const canAdjust = computed(() => checkPermission(10094));
const canAudit = computed(() => checkPermission(10095));
const canRecord = computed(() => checkPermission(10096));

const canViewAny = computed(
  () => canAdjust.value || canAudit.value || canRecord.value,
);

const activeTab = ref('adjust');

function resolveDefaultTab() {
  const tabs = [
    { key: 'adjust', visible: canAdjust.value },
    { key: 'audit', visible: canAudit.value },
    { key: 'record', visible: canRecord.value },
  ];
  const first = tabs.find((item) => item.visible);
  activeTab.value = first?.key || 'adjust';
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="运营管理 · 账户调整"
    title="账户调整"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canAdjust" key="adjust" tab="账户调整">
          <AdjustFormPanel v-if="activeTab === 'adjust'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canAudit" key="audit" tab="调整审核">
          <AdjustAuditList v-if="activeTab === 'audit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canRecord" key="record" tab="调整记录">
          <AdjustRecordList v-if="activeTab === 'record'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="账户调整">
    <Result
      status="403"
      sub-title="需要账户调整相关权限才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
