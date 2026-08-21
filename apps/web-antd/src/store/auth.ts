import type { Recordable, UserInfo } from '@vben/types';

import type { AuthApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  getProjectConfigApi,
  getUserInfoApi,
  loginApi,
  loginByPhoneApi,
  logoutApi,
} from '#/api';
import {
  resetGameConfigCache,
  useGameConfig,
} from '#/composables/use-game-config';
import { $t } from '#/locales';
import { generateAccessRoutes } from '#/router/generate-access-routes';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  removeCloudToken,
  setCloudToken,
} from '#/utils/auth-token';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const cloudStore = useCloudPlatformStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const twoFactorLoading = ref(false);

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  /**
   * 对齐旧站 permission.js + loginWeb：
   * - `Promise.all([fnGetProjectConfig, GetUserInfo])` 后再 GenerateRoutes
   * - 登录成功另调 `fnGetGameConfig`（/api/game/info → platformGameTypeAll）
   * 刷新时旧站读 localStorage；此处一并拉取，避免场馆全称缺失。
   */
  async function initSession() {
    const { ensureGameConfig } = useGameConfig();
    const [, userInfo] = await Promise.all([
      getProjectConfigApi(),
      fetchUserInfo(),
      ensureGameConfig(true).catch((error) => {
        console.error('[initSession] ensureGameConfig failed', error);
      }),
    ]);
    const accessCodes = await getAccessCodesApi();
    accessStore.setAccessCodes(accessCodes);
    return userInfo;
  }

  /** 对齐旧站 GenerateRoutes + addRoutes */
  async function generateAccessRoutesAction() {
    return generateAccessRoutes(router);
  }

  /**
   * 对齐旧站 loginWeb handleLoginSuccess：
   * GetUserInfo → fnGetProjectConfig → GenerateRoutes → push 首页
   */
  async function completeLogin(
    accessToken: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    accessStore.setAccessToken(accessToken);
    setCloudToken(accessToken);

    // 登录后重置，避免沿用上一次会话的菜单标记
    accessStore.setIsAccessChecked(false);

    const userInfo = await initSession();
    await generateAccessRoutesAction();

    const homePath =
      userStore.userInfo?.homePath || preferences.app.defaultHomePath;

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess ? await onSuccess?.() : await router.push(homePath);
    }

    if (userInfo?.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }

    return userStore.userInfo ?? userInfo;
  }

  /**
   * 账号密码登录
   * - 直接拿到 Token：完成登录
   * - 返回 require2FA：由页面弹出谷歌/短信验证
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ): Promise<{
    loginResult?: AuthApi.LoginResult;
    userInfo: null | UserInfo;
  }> {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);

      if (loginResult.require2FA) {
        return { loginResult, userInfo };
      }

      if (loginResult.accessToken) {
        userInfo = await completeLogin(loginResult.accessToken, onSuccess);
      }

      return { loginResult, userInfo };
    } catch (error) {
      console.error('[authLogin] failed', error);
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  /**
   * 二次验证登录（谷歌验证码 / 短信）
   * 对齐旧系统 LoginByUsername2FA → /public/user/vlogin
   */
  async function authLoginBy2FA(
    params: {
      UseNewPermission?: boolean;
      Username: string;
      ValidCode: string;
    },
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      twoFactorLoading.value = true;
      const loginResult = await loginByPhoneApi({
        UseNewPermission: true,
        ...params,
      });

      if (!loginResult.accessToken) {
        throw new Error('二次验证失败，未返回 Token');
      }

      userInfo = await completeLogin(loginResult.accessToken, onSuccess);
      return { userInfo };
    } catch (error) {
      console.error('[authLoginBy2FA] failed', error);
      throw error;
    } finally {
      twoFactorLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // ignore logout api errors
    }

    removeCloudToken();
    resetGameConfigCache();
    cloudStore.$reset();
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  function $reset() {
    loginLoading.value = false;
    twoFactorLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authLoginBy2FA,
    completeLogin,
    fetchUserInfo,
    generateAccessRoutes: generateAccessRoutesAction,
    initSession,
    loginLoading,
    logout,
    twoFactorLoading,
  };
});
