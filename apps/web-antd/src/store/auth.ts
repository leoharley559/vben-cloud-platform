import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import type { AuthApi } from '#/api';
import {
  getAccessCodesApi,
  getProjectConfigApi,
  getUserInfoApi,
  loginApi,
  loginByPhoneApi,
  logoutApi,
} from '#/api';
import { $t } from '#/locales';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  removeAuthToken,
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

  async function completeLogin(
    accessToken: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    accessStore.setAccessToken(accessToken);
    setCloudToken(accessToken);

    await getProjectConfigApi();
    const userInfo = await fetchUserInfo();
    const accessCodes = await getAccessCodesApi();
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(accessCodes);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(
            userInfo.homePath || preferences.app.defaultHomePath,
          );
    }

    if (userInfo?.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }

    return userInfo;
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
      Username: string;
      ValidCode: string;
      UseNewPermission?: boolean;
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
    removeAuthToken();
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

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  async function initSession() {
    await getProjectConfigApi();
    return fetchUserInfo();
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
    initSession,
    loginLoading,
    logout,
    twoFactorLoading,
  };
});
