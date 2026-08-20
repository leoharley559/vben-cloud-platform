import { onMounted, onUnmounted, ref } from 'vue';

import { Modal } from 'ant-design-vue';

import {
  APP_VERSION,
  formatAppVersion,
  getVersionJsonUrl,
} from '#/utils/app-version';

const CHECK_INTERVAL_MS = 60_000;

let modalVisible = false;

export function useAppVersionCheck() {
  const checking = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  async function fetchRemoteVersion() {
    const response = await fetch(getVersionJsonUrl(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return '';
    }
    const data = (await response.json()) as { version?: string };
    return String(data.version || '').trim();
  }

  function reloadToVersion(remoteVersion: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('v', remoteVersion);
    window.location.replace(url.toString());
  }

  function notifyUpdate(remoteVersion: string) {
    if (modalVisible) {
      return;
    }
    modalVisible = true;
    Modal.warning({
      centered: true,
      closable: false,
      content: `当前 ${formatAppVersion(APP_VERSION)}，最新 ${formatAppVersion(remoteVersion)}。请刷新页面后再继续操作。`,
      keyboard: false,
      maskClosable: false,
      okText: '立即刷新',
      title: '发现新版本',
      onOk: () => {
        reloadToVersion(remoteVersion);
      },
    });
  }

  async function checkForUpdates() {
    if (import.meta.env.DEV || checking.value || modalVisible) {
      return;
    }
    checking.value = true;
    try {
      const remoteVersion = await fetchRemoteVersion();
      if (remoteVersion && remoteVersion !== APP_VERSION) {
        notifyUpdate(remoteVersion);
      }
    } catch {
      // 本地或网络异常时不打断使用
    } finally {
      checking.value = false;
    }
  }

  function handleVisibilityChange() {
    if (!document.hidden) {
      void checkForUpdates();
    }
  }

  onMounted(() => {
    void checkForUpdates();
    timer = setInterval(() => {
      void checkForUpdates();
    }, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
}
