<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GiftAuditPanel from './components/gift-audit-panel.vue';
import GiftDeliverPanel from './components/gift-deliver-panel.vue';

defineOptions({ name: 'GiftManage' });

const { checkPermission } = useCloudPermission();

const canAudit = computed(() => checkPermission(10_170));
const canDelivery = computed(() => checkPermission(10_171));
const canViewPage = computed(() => canAudit.value || canDelivery.value);
const activeTab = ref('audit');

onMounted(() => {
  activeTab.value = canAudit.value ? 'audit' : 'delivery';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 礼品管理"
    title="礼品管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canAudit" key="audit" tab="审核列表">
          <GiftAuditPanel v-if="activeTab === 'audit'" />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canDelivery" key="delivery" tab="发货列表">
          <GiftDeliverPanel v-if="activeTab === 'delivery'" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无礼品管理查看权限" title="403" />
</template>
