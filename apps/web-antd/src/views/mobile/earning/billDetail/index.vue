<script lang="ts" setup>
import { Card, Empty } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningBillDetail' });
</script>

<template>
  <Card size="small" title="账单详情">
    <MobileMvpTip />
    <Empty description="账单详情等待下一迭代迁移" />
  </Card>
</template>
