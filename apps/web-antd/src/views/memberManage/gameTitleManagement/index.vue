<script lang="ts" setup>
/**
 * 兼容旧菜单路径 memberManage/gameTitleManagement
 * 正式入口：operationalManage/gameTitle
 */
import GameTitle from '../../operationalManage/gameTitle/index.vue';

defineOptions({ name: 'GameTitleManagement' });
</script>

<template>
  <GameTitle />
</template>
