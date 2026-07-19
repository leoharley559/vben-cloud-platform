<script lang="ts" setup>
import { Card, Empty } from 'ant-design-vue';

defineProps<{
  channel: Record<string, unknown>;
}>();

defineOptions({ name: 'MobilePromotionQrCode' });
</script>

<template>
  <Card size="small" title="推广二维码">
    <Empty description="二维码渲染等待下一迭代迁移" />
    <p class="mt-2 break-all text-xs text-gray-500">
      {{ channel.PromoteUrl || channel.DownloadUrl || '-' }}
    </p>
  </Card>
</template>
