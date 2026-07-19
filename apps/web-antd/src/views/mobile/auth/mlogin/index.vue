<script lang="ts" setup>
import MobileTeamLogin from '#/views/mobile/components/mobile-team-login.vue';

defineOptions({ name: 'MobileTeamLoginPage' });
</script>

<template>
  <MobileTeamLogin redirect-path="/mobile/index" title="代理移动端登录" />
</template>
