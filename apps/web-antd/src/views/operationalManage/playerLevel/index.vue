<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PlayerLevelPanel from './components/player-level-panel.vue';

defineOptions({ name: 'PlayerLevel' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(12281));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 会员层级"
    title="会员层级"
  >
    <Card>
      <PlayerLevelPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无会员层级查看权限" title="403" />
</template>
