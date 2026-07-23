import { onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

import { useAuthStore } from '#/store';

/** 对齐旧 App.vue minGap：30 分钟刷新一次用户信息（仅 islogin，不重建路由） */
const USER_INFO_REFRESH_GAP_MS = 30 * 60 * 1000;

/**
 * 对齐 cloudPlatform App.vue `funMouseMove`：
 * 鼠标活动后延迟拉取 GetUserInfo，保持会话 / Nav 数据新鲜；侧栏仍依赖 F5 重建路由。
 */
export function useUserInfoRefreshOnActivity() {
  const route = useRoute();
  const authStore = useAuthStore();

  let lastRefreshAt = Date.now();
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;

  const onMouseMove = () => {
    const now = Date.now();
    if (now <= lastRefreshAt) {
      return;
    }
    lastRefreshAt = now + USER_INFO_REFRESH_GAP_MS;

    if (route.path === LOGIN_PATH || route.path.startsWith('/auth')) {
      return;
    }

    if (pendingTimer) {
      clearTimeout(pendingTimer);
    }
    pendingTimer = setTimeout(() => {
      void authStore.fetchUserInfo().catch(() => {
        // 对齐旧站：静默失败，不打断操作
      });
    }, USER_INFO_REFRESH_GAP_MS);
  };

  onMounted(() => {
    window.addEventListener('mousemove', onMouseMove);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
    }
  });
}
