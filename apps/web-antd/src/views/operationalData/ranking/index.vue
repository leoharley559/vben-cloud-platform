<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import EndlessRankPanel from './components/endless-rank-panel.vue';
import GameRankPanel from './components/game-rank-panel.vue';
import PayRankPanel from './components/pay-rank-panel.vue';
import WinLossRankPanel from './components/win-loss-rank-panel.vue';

defineOptions({ name: 'OperationalRanking' });

const { checkPermission } = useCloudPermission();

/**
 * 对齐旧站 ranking.vue：
 * - 输赢 10638（子权限 赢 10642 / 输 10643）
 * - 充兑 10639（充 10644 / 兑 10645）
 * - 游戏 10640（盈 10647 / 亏 10648）
 * - 无限代理：旧站 import 了组件但未挂 Tab；新站按权限 10641 + 10777 展示
 */
const tabs = computed(() =>
  [
    {
      component: WinLossRankPanel,
      key: 'winLoss',
      show:
        checkPermission(10_638) &&
        (checkPermission(10_642) || checkPermission(10_643)),
      tab: '输赢排行',
    },
    {
      component: PayRankPanel,
      key: 'pay',
      show:
        checkPermission(10_639) &&
        (checkPermission(10_644) || checkPermission(10_645)),
      tab: '充兑排行',
    },
    {
      component: GameRankPanel,
      key: 'game',
      show:
        checkPermission(10_640) &&
        (checkPermission(10_647) || checkPermission(10_648)),
      tab: '游戏排行',
    },
    {
      component: EndlessRankPanel,
      key: 'endless',
      show: checkPermission(10_641) && checkPermission(10_777),
      tab: '无限代理排行',
    },
  ].filter((item) => item.show),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('winLoss');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'winLoss';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 排行榜"
    title="排行榜"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <component :is="item.component" v-if="activeTab === item.key" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无排行榜查看权限" title="403" />
</template>
