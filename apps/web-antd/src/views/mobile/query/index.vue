<script lang="ts" setup>
import { ref } from 'vue';

import { Card, Tabs } from 'ant-design-vue';

import GameDetail from './gameDetail/index.vue';
import PlayerInfo from './playerInfo/index.vue';
import PlayerList from './playerList/index.vue';

defineOptions({ name: 'MobileQueryPanel' });

const activeTab = ref('players');
const selectedPlayer = ref<Record<string, unknown>>();

function handleSelectPlayer(record: Record<string, unknown>) {
  selectedPlayer.value = record;
  activeTab.value = 'info';
}
</script>

<template>
  <Card>
    <Tabs v-model:active-key="activeTab" type="line" size="small">
      <Tabs.TabPane key="game" tab="游戏明细">
        <GameDetail v-if="activeTab === 'game'" />
      </Tabs.TabPane>
      <Tabs.TabPane key="players" tab="玩家列表">
        <PlayerList
          v-if="activeTab === 'players'"
          @select="handleSelectPlayer"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="info" tab="玩家详情">
        <PlayerInfo
          v-if="activeTab === 'info'"
          :player="selectedPlayer"
          @back="activeTab = 'players'"
        />
      </Tabs.TabPane>
    </Tabs>
  </Card>
</template>
