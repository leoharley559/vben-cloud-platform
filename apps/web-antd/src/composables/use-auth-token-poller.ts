import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

import {
  ensureAuthToken,
  FORBIDDEN_PATH,
  hasRequiredAuthToken,
  shouldUseFallbackAuthToken,
} from '#/utils/ensure-auth-token';

const AUTH_POLL_INTERVAL_MS = 290 * 1000;

/**
 * cloudPlatform AuthToken 轮询（对齐旧 App.vue）
 * 正式服 cookie `auth` 丢失 → /403，不是登录页
 */
export function useAuthTokenPoller() {
  const router = useRouter();
  let timer: ReturnType<typeof setInterval> | undefined;

  const checkAuthToken = () => {
    ensureAuthToken();

    if (shouldUseFallbackAuthToken()) {
      return;
    }

    if (
      !hasRequiredAuthToken() &&
      router.currentRoute.value.path !== FORBIDDEN_PATH
    ) {
      void router.replace(FORBIDDEN_PATH);
    }
  };

  onMounted(() => {
    checkAuthToken();
    timer = setInterval(checkAuthToken, AUTH_POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });
}
