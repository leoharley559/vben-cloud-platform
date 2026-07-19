<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, Empty } from 'ant-design-vue';

defineOptions({ name: 'CoinDealerMessageList' });
</script>

<template>
  <Page auto-content-height description="币商管理 · 消息组件" title="消息列表">
    <Card>
      <Empty description="聊天消息气泡组件，由客服工作台内嵌使用" />
    </Card>
  </Page>
</template>
