<script lang="ts" setup>
import { computed, watch } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { App, ConfigProvider, theme } from 'ant-design-vue';

import { useAppVersionCheck } from '#/composables/use-app-version-check';
import { useAuthTokenPoller } from '#/composables/use-auth-token-poller';
import { useUserInfoRefreshOnActivity } from '#/composables/use-user-info-refresh';
import { antdLocale } from '#/locales';
import { ensureAuthToken } from '#/utils/ensure-auth-token';

defineOptions({ name: 'App' });

/** 登录页也在 Auth 布局下，必须在这里初始化 AuthToken（开发环境写兜底，正式服只读 cookie） */
ensureAuthToken();
useAuthTokenPoller();
useAppVersionCheck();
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
    components: {
      Table: {
        headerBorderRadius: 4,
      },
    },
    token: tokens,
  };
});

// Modal.confirm / message / notification 走独立实例，必须同步全局主题，否则暗色下仍是白底
watch(
  [tokenTheme, antdLocale],
  ([themeConfig, locale]) => {
    ConfigProvider.config({
      locale,
      theme: themeConfig,
    } as Parameters<typeof ConfigProvider.config>[0]);
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
    </App>
  </ConfigProvider>
</template>
