<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Alert, Card } from 'ant-design-vue';

defineOptions({ name: 'CloudPlaceholder' });

const route = useRoute();

const pageTitle = computed(() =>
  String(route.meta?.title || route.name || '未命名页面'),
);
const originalPath = computed(() =>
  String(route.meta?.originalPath || route.path),
);
</script>

<template>
  <Page :title="pageTitle" auto-content-height>
    <Card>
      <Alert
        show-icon
        type="info"
        message="页面待迁移"
        :description="`当前菜单「${pageTitle}」对应路径 ${originalPath} 尚未从 cloudPlatform 迁移到本项目。登录与菜单已打通，业务页面会按改版方案分批复刻。`"
      />
      <p class="text-muted-foreground mt-4 text-sm">
        下一步建议优先迁移「系统管理 → 管理员管理」作为样板页。
      </p>
    </Card>
  </Page>
</template>
