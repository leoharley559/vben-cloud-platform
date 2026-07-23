<script lang="ts" setup>
import { computed } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { App, ConfigProvider, theme } from 'ant-design-vue';

import { useAuthTokenPoller } from '#/composables/use-auth-token-poller';
import { useUserInfoRefreshOnActivity } from '#/composables/use-user-info-refresh';
import { antdLocale } from '#/locales';
import { ensureAuthToken } from '#/utils/ensure-auth-token';

defineOptions({ name: 'App' });

/** 登录页也在 Auth 布局下，必须在这里初始化 AuthToken */
ensureAuthToken();
useAuthTokenPoller();
/** 对齐旧 App.vue funMouseMove：活动后定时刷新 islogin */
useUserInfoRefreshOnActivity();

const { isDark } = usePreferences();
const { tokens } = useAntdDesignTokens();

const tokenTheme = computed(() => {
  const algorithm = isDark.value
    ? [theme.darkAlgorithm]
    : [theme.defaultAlgorithm];

  // antd 紧凑模式算法
  if (preferences.app.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  return {
    algorithm,
    token: tokens,
  };
});
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
    </App>
  </ConfigProvider>
</template>
