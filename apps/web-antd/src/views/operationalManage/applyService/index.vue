<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ApplyServicePanel from './components/apply-service-panel.vue';

defineOptions({ name: 'ApplyService' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(
  () => checkPermission(10_925) || checkPermission(10_079),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 客服工单"
    title="客服工单"
  >
    <Card>
      <ApplyServicePanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服工单查看权限" title="403" />
</template>
