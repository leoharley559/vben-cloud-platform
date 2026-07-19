<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GoldGrantPanel from './components/gold-grant-panel.vue';
import GoldRecordPanel from './components/gold-record-panel.vue';

defineOptions({ name: 'PlayerGoldHandle' });

const { checkPermission } = useCloudPermission();

const canGrant = computed(() => checkPermission(10081));
const canRecord = computed(() => checkPermission(10086));
const canViewPage = computed(() => canGrant.value || canRecord.value);

const activeTab = ref('save');

onMounted(() => {
  if (canGrant.value) {
    activeTab.value = 'save';
  } else if (canRecord.value) {
    activeTab.value = 'record';
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
          <GoldRecordPanel v-if="activeTab === 'record'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无红利发放查看权限" title="403" />
</template>
