<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ServiceWorkbenchPanel from '../serviceModel/components/service-workbench-panel.vue';

defineOptions({ name: 'ServicePlayerService' });

const { checkPermissionByKey } = useCloudPermission();

const canViewPage = computed(
  () =>
    checkPermissionByKey('servicePlayerList') ||
    checkPermissionByKey('serviceMonitorPage'),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 客服系统"
    title="客服系统"
  >
    <Card>
      <ServiceWorkbenchPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服系统查看权限" title="403" />
</template>
