<script lang="ts" setup>
import { Fallback } from '@vben/common-ui';

defineOptions({ name: 'Page403' });
</script>

<template>
  <Fallback
    description="您无权访问该功能，请联系管理员获取权限"
    status="403"
    title="无权访问"
  >
    <!-- 对齐旧站 403：无返回首页按钮 -->
    <template #action>
      <span></span>
    </template>
  </Fallback>
</template>
