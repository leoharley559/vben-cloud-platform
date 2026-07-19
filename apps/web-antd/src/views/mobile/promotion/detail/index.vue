<script lang="ts" setup>
import { Card, Descriptions } from 'ant-design-vue';

defineProps<{
  channel: Record<string, unknown>;
}>();

defineOptions({ name: 'MobilePromotionDetail' });
</script>

<template>
  <Card size="small" title="推广详情">
    <Descriptions :column="1" size="small">
      <Descriptions.Item label="渠道">
        {{ channel.ChannelName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="包名">
        {{ channel.PackageName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="推广链接">
        {{ channel.PromoteUrl || '-' }}
      </Descriptions.Item>
    </Descriptions>
  </Card>
</template>
