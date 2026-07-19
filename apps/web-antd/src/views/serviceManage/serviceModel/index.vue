<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ServiceWorkbenchPanel from './components/service-workbench-panel.vue';

defineOptions({ name: 'ServiceModel' });

const { checkPermissionByKey } = useCloudPermission();

const canViewPage = computed(
  () =>
    checkPermissionByKey('servicePlayerList') ||
    checkPermissionByKey('serviceVersionSwitchBtn'),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 客服工作台"
    title="客服工作台"
  >
    <Card>
      <ServiceWorkbenchPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服工作台查看权限" title="403" />
</template>
