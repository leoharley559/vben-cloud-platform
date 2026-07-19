<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import RechargeTypePanel from './components/recharge-type-panel.vue';

defineOptions({ name: 'RechargeManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_817));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 充值管理"
    title="充值管理"
  >
    <Card title="通道管理">
      <RechargeTypePanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无充值管理查看权限" title="403" />
</template>
