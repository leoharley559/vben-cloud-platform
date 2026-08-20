<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'CoinDealerAgentTracking' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(12_370));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="币商管理 · 实时监控"
    title="实时监控"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        WebSocket 会话监控、虚拟滚动消息列表等待下一迭代迁移。
      </div>
      <Empty description="实时监控需接入 BS WebSocket" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无实时监控查看权限" title="403" />
</template>
