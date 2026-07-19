<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, Empty } from 'ant-design-vue';

defineOptions({ name: 'CoinDealerCustomeModule' });
</script>

<template>
  <Page auto-content-height description="币商管理 · 客服模块" title="客服模块">
    <Card>
      <Empty description="客服模块由 customeService 承载，等待下一迭代迁移" />
    </Card>
  </Page>
</template>
