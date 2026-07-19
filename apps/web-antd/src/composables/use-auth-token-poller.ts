import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

import {
  ensureAuthToken,
  shouldUseFallbackAuthToken,
} from '#/utils/ensure-auth-token';
import { getAuthToken } from '#/utils/auth-token';

const AUTH_POLL_INTERVAL_MS = 290 * 1000;

/**
 * cloudPlatform AuthToken 轮询（对齐旧 App.vue 逻辑）
 */
export function useAuthTokenPoller() {
  const router = useRouter();
  let timer: ReturnType<typeof setInterval> | undefined;

  const checkAuthToken = () => {
    ensureAuthToken();

    if (shouldUseFallbackAuthToken()) {
      return;
    }

    if (!getAuthToken()) {
      router.replace('/auth/login');
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
