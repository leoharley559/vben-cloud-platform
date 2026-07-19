<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import HelpOrderPanel from './components/help-order-panel.vue';

defineOptions({ name: 'HelpOrder' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10234));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 协助工单（协助者视角）"
    title="协助工单"
  >
    <Card>
      <HelpOrderPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无协助工单查看权限" title="403" />
</template>
