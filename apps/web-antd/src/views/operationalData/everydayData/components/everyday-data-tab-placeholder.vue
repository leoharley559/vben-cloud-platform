<script lang="ts" setup>
import { Alert } from 'ant-design-vue';

defineOptions({ name: 'EverydayDataTabPlaceholder' });

defineProps<{
  description: string;
  title: string;
}>();
</script>

<template>
  <div class="py-8">
    <Alert show-icon type="info">
      <template #message>{{ title }}</template>
      <template #description>
        <p>{{ description }}</p>
        <p class="mt-2 text-xs text-gray-400">
          旧站对应页面已按权限恢复 Tab
          入口；业务表格/筛选/导出将在下一迭代对标迁移。
        </p>
      </template>
    </Alert>
  </div>
</template>
