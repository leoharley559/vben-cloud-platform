<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GroupDailyPanel from './components/group-daily-panel.vue';

defineOptions({ name: 'GroupDaily' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_686));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 代理分组日报"
    title="代理分组日报"
  >
    <Card size="small">
      <GroupDailyPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理分组日报查看权限" title="403" />
</template>
