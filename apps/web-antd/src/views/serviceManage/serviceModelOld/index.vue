<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ServiceWorkbenchPanel from '../serviceModel/components/service-workbench-panel.vue';

defineOptions({ name: 'ServiceModelOld' });

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
    description="客服管理 · 旧版客服工作台"
    title="旧版客服工作台"
  >
    <Card>
      <div class="mb-3 text-xs text-gray-400">
        旧版入口暂复用同一工作台薄切片；完整旧 UI / Protobuf 待后续专项。
      </div>
      <ServiceWorkbenchPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无客服工作台查看权限" title="403" />
</template>
