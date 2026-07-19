<script lang="ts" setup>
import { Result } from 'ant-design-vue';

defineOptions({ name: 'PlayerDetailTabPlaceholder' });

defineProps<{
  tabLabel: string;
}>();
</script>

<template>
  <Result
    status="info"
    :sub-title="`「${tabLabel}」子模块待从 cloudPlatform 迁移`"
    title="开发中"
  />
</template>
