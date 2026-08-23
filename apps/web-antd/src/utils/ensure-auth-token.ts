import { getAuthToken, setAuthToken } from '#/utils/auth-token';
import { isDevMode } from '#/utils/crypto';

/** 与旧 cloudPlatform App.vue 一致的开发 / H5 兜底 AuthToken */
export const DEV_AUTH_TOKEN = '1111122222223333333444444445555555';

/** 正式服缺 cookie `auth` 时的落地页（对齐旧站 /403） */
export const FORBIDDEN_PATH = '/403';

function queryHasH5Flag(search: string) {
  return new URLSearchParams(search).get('isH5') === '1';
}

/**
 * 仅本地开发、`?isH5=1`、或显式打开 VITE_USE_FALLBACK_AUTH_TOKEN 时走兜底。
 * 正式服必须从 cookie `auth` 读取，禁止写死 token。
 */
export function shouldUseFallbackAuthToken() {
  if (isDevMode || import.meta.env.VITE_USE_FALLBACK_AUTH_TOKEN === 'true') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  if (queryHasH5Flag(window.location.search)) {
    return true;
  }
  // hash 路由：`#/path?isH5=1` 不在 location.search 里
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  return qIndex !== -1 && queryHasH5Flag(hash.slice(qIndex + 1));
}

export function hasRequiredAuthToken() {
  if (shouldUseFallbackAuthToken()) {
    return true;
  }
  return Boolean(getAuthToken());
}

/**
 * 确保请求头所需 AuthToken 已就绪。
 * 正式服只读 cookie，没有则返回空（由路由守卫跳 403）。
 */
export function ensureAuthToken() {
  if (shouldUseFallbackAuthToken()) {
    setAuthToken(DEV_AUTH_TOKEN);
    return DEV_AUTH_TOKEN;
  }

  return getAuthToken() || '';
}
