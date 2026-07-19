<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelListPanel from './components/channel-list-panel.vue';

defineOptions({ name: 'CreateChannel' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(12_301));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 渠道管理"
    title="渠道管理"
  >
    <Card>
      <ChannelListPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无渠道管理查看权限" title="403" />
</template>
