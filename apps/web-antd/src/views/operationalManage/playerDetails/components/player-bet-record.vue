<script lang="ts" setup>
import GameRecordListPanel from '../../../memberManage/gameRecord/components/game-record-list-panel.vue';

defineOptions({ name: 'PlayerBetRecord' });

defineProps<{
  loginAccount?: string;
  playerId: number | string;
}>();
</script>

<template>
  <GameRecordListPanel
    scope="player"
    :login-account="loginAccount"
    :player-id="playerId"
  />
</template>
