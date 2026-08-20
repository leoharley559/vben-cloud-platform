<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import HelpManagePanel from './components/help-manage-panel.vue';

defineOptions({ name: 'HelpManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_230));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 协助管理（代理视角）"
    title="协助管理"
  >
    <Card>
      <HelpManagePanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无协助管理查看权限" title="403" />
</template>
