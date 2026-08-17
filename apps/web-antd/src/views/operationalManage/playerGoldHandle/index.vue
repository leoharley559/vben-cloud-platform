<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GoldGrantPanel from './components/gold-grant-panel.vue';
import GoldRecordPanel from './components/gold-record-panel.vue';

defineOptions({ name: 'PlayerGoldHandle' });

const { checkPermission } = useCloudPermission();

const canGrant = computed(() => checkPermission(10_081));
const canRecord = computed(() => checkPermission(10_086));
/** 对齐旧站 takeRecord：表格查看权限 10092 */
const canTakeRecord = computed(() => checkPermission(10_092));
const canViewPage = computed(
  () => canGrant.value || canRecord.value || canTakeRecord.value,
);

const activeTab = ref('save');

onMounted(() => {
  if (canGrant.value) {
    activeTab.value = 'save';
  } else if (canRecord.value) {
    activeTab.value = 'record';
  } else if (canTakeRecord.value) {
    activeTab.value = 'takeRecord';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 红利发放"
    title="红利发放"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canGrant" key="save" tab="红利发放">
          <GoldGrantPanel v-if="activeTab === 'save'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canRecord" key="record" tab="发放记录">
          <GoldRecordPanel
            v-if="activeTab === 'record'"
            :handle-type="1"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canTakeRecord" key="takeRecord" tab="扣减记录">
          <GoldRecordPanel
            v-if="activeTab === 'takeRecord'"
            :handle-type="2"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无红利发放查看权限" title="403" />
</template>
