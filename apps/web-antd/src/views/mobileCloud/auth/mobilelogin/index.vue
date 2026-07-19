<script lang="ts" setup>
import MobileTeamLogin from '#/views/mobile/components/mobile-team-login.vue';

defineOptions({ name: 'MobileCloudLoginPage' });
</script>

<template>
  <MobileTeamLogin redirect-path="/mobileCloud/index" title="云终端登录" />
</template>
