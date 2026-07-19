import { getAuthToken, setAuthToken } from '#/utils/auth-token';
import { isDevMode } from '#/utils/crypto';

/** 与旧 cloudPlatform App.vue 一致的开发 / H5 兜底 AuthToken */
export const DEV_AUTH_TOKEN = '1111122222223333333444444445555555';

export function shouldUseFallbackAuthToken() {
  if (isDevMode) {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('isH5') === '1';
}

/**
 * 确保请求头所需 AuthToken 已就绪（登录页也会调用）
 */
export function ensureAuthToken() {
  if (shouldUseFallbackAuthToken()) {
    setAuthToken(DEV_AUTH_TOKEN);
    return DEV_AUTH_TOKEN;
  }

  return getAuthToken() || '';
}
