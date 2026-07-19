<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PayRankPanel from '../ranking/components/pay-rank-panel.vue';

defineOptions({ name: 'OperationalPayRanking' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(
  () => checkPermission(10_644) || checkPermission(10_645),
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 充兑排行"
    title="充兑排行"
  >
    <Card>
      <PayRankPanel />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无充兑排行查看权限" title="403" />
</template>
