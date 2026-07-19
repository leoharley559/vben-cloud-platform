<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, Empty } from 'ant-design-vue';

defineOptions({ name: 'CoinDealerCustomeService' });
</script>

<template>
  <Page
    auto-content-height
    description="币商管理 · 客服工作台"
    title="客服工作台"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        币商客服 WebSocket 聊天、售币操作等待下一迭代迁移（需 BS WebSocket
        专项）。
      </div>
      <Empty description="客服工作台需接入实时通信层" />
    </Card>
  </Page>
</template>
