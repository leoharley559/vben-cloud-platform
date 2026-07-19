<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PackageManagePanel from './components/package-manage-panel.vue';

defineOptions({ name: 'PackageManage' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(
  () => checkPermission(12355) || checkPermission(13189),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 包管理"
    title="包管理"
  >
    <Card>
      <PackageManagePanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无包管理查看权限" title="403" />
</template>
