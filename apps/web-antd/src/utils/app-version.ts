import appVersionMeta from '#/app-version.json';

export const APP_VERSION = String(appVersionMeta.version || '').trim();

export function formatAppVersion(version = APP_VERSION) {
  const value = String(version || '').trim();
  if (!value) return '';
  return value.startsWith('v') ? value : `v${value}`;
}

export function getVersionJsonUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}version.json?t=${Date.now()}`;
}
