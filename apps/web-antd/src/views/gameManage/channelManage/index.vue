<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelManagePanel from './components/channel-manage-panel.vue';

defineOptions({ name: 'ChannelManage' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(
  () => checkPermission(12_302) || checkPermission(12_303),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 渠道配置"
    title="渠道配置"
  >
    <Card>
      <ChannelManagePanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无渠道配置查看权限" title="403" />
</template>
