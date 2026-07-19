<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'ServiceModelSwitch' });

const { checkPermissionByKey } = useCloudPermission();

const canViewPage = computed(() =>
  checkPermissionByKey('serviceVersionSwitchBtn'),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="客服管理 · 工作台版本切换"
    title="工作台版本切换"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        新旧工作台切换开关依赖实时会话层，当前仅占位；实际入口仍走旧站或后续 WS
        专项。
      </div>
      <Empty description="版本切换需接入客服工作台后可用" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无版本切换权限" title="403" />
</template>
