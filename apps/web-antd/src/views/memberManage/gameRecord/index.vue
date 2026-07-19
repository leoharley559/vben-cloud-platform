<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GameRecordListPanel from './components/game-record-list-panel.vue';

defineOptions({ name: 'GameRecordManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(12205));
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="会员管理 · 游戏记录"
    title="游戏记录"
  >
    <Card>
      <GameRecordListPanel scope="global" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无游戏记录查看权限" title="403" />
</template>
