<script lang="ts" setup>
import { Button, Card, Descriptions } from 'ant-design-vue';

defineOptions({ name: 'MobileQueryPlayerInfo' });

defineProps<{
  player?: Record<string, unknown>;
}>();

const emit = defineEmits<{ back: [] }>();

</script>

<template>
  <Card size="small" title="玩家信息">
    <Button class="mb-3" size="small" @click="emit('back')">返回列表</Button>
    <Descriptions :column="1" size="small">
      <Descriptions.Item label="账号">
        {{ player?.LoginAccount || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="昵称">
        {{ player?.PlayerName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="手机号">
        {{ player?.PhoneNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="包名">
        {{ player?.PackageName || '-' }}
      </Descriptions.Item>
    </Descriptions>
  </Card>
</template>
