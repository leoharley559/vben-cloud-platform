import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { RequestClient } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message, Modal } from 'ant-design-vue';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import qs from 'qs';

import type { CloudApiResponse } from '#/types/cloud-platform';
import {
  getAuthToken,
  getCloudToken,
  getHelpLink,
  getLanguageCookie,
} from '#/utils/auth-token';
import { decryptResponse, encryptData, isDevMode } from '#/utils/crypto';
import { ensureAuthToken } from '#/utils/ensure-auth-token';
import {
  FORCE_LOGOUT_CODE,
  LOGOUT_ERROR_CODES,
  mapErrorMessage,
  PASSTHROUGH_ERROR_CODES,
} from '#/utils/error-code-mapping';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const voipBaseURL = import.meta.env.VITE_VOIP_BASE_API;
const apiSuccessCode = Number(import.meta.env.VITE_API_SUCCESS_CODE ?? 200);

let logoutModalVisible = false;

function isVoipRequest(url = '') {
  return !!voipBaseURL && url.startsWith(voipBaseURL);
}

function isPublicRequest(url = '') {
  return (
    url.includes('/user/login') ||
    url.includes('/public/user/captcha') ||
    url.includes('/user/vlogin') ||
    url.includes('/user/sendcode') ||
    url.includes('/user/logout') ||
    url.includes('/api/')
  );
}

function normalizeResponseData<T>(responseData: CloudApiResponse<T>) {
  if (
    responseData.respond &&
    typeof responseData.respond === 'object' &&
    responseData.respond !== null
  ) {
    responseData.Data = responseData.respond;
  }
  if (responseData.status !== undefined) {
    responseData.Code = responseData.status;
  } else if (responseData.Code !== undefined) {
    responseData.status = responseData.Code;
  }
  return responseData;
}

function transformRequestBody(
  data: unknown,
  headers: InternalAxiosRequestConfig['headers'],
) {
  if (!data) {
    return data;
  }

  const contentType = String(headers?.['Content-Type'] || '');

  if (contentType.includes('multipart/form-data')) {
    return data;
  }

  if (contentType.includes('application/json')) {
    const payload = encryptData(JSON.stringify(data));
    if (!isDevMode && headers) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return payload;
  }

  if (typeof data === 'string') {
    return encryptData(data);
  }

  let serialized = '';
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    serialized += `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}&`;
  }
  return encryptData(serialized);
}

function showLogoutModal(content: string, force = false) {
  if (logoutModalVisible) {
    return;
  }
  logoutModalVisible = true;
  Modal.warning({
    closable: false,
    content,
    keyboard: false,
    maskClosable: false,
    okText: '重新登录',
    title: force ? '账号已在别处登录' : '登录状态已失效',
    onOk: async () => {
      logoutModalVisible = false;
      const { useAuthStore } = await import('#/store');
      await useAuthStore().logout(false);
      window.location.reload();
    },
  });
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    paramsSerializer: (params) => {
      const serialized = qs.stringify(params, { arrayFormat: 'brackets' });
      return encryptData(serialized);
    },
    timeout: 60_000,
    transformRequest: [(data, headers) => transformRequestBody(data, headers)],
  });

  client.addRequestInterceptor({
    fulfilled: (config) => {
      const accessStore = useAccessStore();
      const token = getCloudToken() || accessStore.accessToken;
      const requestUrl = config.url || '';

      if (isVoipRequest(requestUrl)) {
        config.baseURL = voipBaseURL;
        config.headers['Content-Type'] = 'application/json';
        return config;
      }

      if (!isDevMode && !config.params && !config.data) {
        config.params = { content: 'empty' };
      }

      // 每次请求前确保 AuthToken（登录页也会发请求）
      const authToken = ensureAuthToken() || getAuthToken();

      if (isPublicRequest(requestUrl) || token) {
        config.headers.Token = token;
        config.headers.Language = getLanguageCookie() || preferences.app.locale;
        config.headers.AuthToken = authToken;
      }

      // 协助工单：旧站以 Cookie 传 HelpLink；请求头一并带上以提高兼容性
      const helpLink = getHelpLink();
      if (helpLink) {
        config.headers.HelpLink = helpLink;
      }

      return config;
    },
  });

  client.addResponseInterceptor({
    fulfilled: (response: AxiosResponse<CloudApiResponse>) => {
      if (isVoipRequest(response.config.url)) {
        return response;
      }

      decryptResponse(response);
      let responseData = response.data;

      if (responseData && typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          const statusMatch =
            String(responseData).match(/"status"\s*:\s*(\d+)/) ||
            String(responseData).match(/"Code"\s*:\s*(\d+)/);
          if (statusMatch) {
            responseData = {
              Code: Number(statusMatch[1]),
              Data: null,
              message: '',
              status: Number(statusMatch[1]),
            };
          }
        }
      }

      response.data = normalizeResponseData(responseData as CloudApiResponse);

      const status = Number(response.data.status);
      const requestUrl = response.config.url || '';

      // 登录相关接口的 403 只提示，不整页跳转（缺 AuthToken / 无权限时常见）
      if (status === 403) {
        const errorMsg = response.data.message || '无访问权限(403)';
        if (
          requestUrl.includes('/user/login') ||
          requestUrl.includes('/user/vlogin') ||
          requestUrl.includes('/user/islogin') ||
          requestUrl.includes('/public/user/')
        ) {
          message.error(errorMsg);
          return Promise.reject(response.data);
        }
        message.error(errorMsg);
        return Promise.reject(response.data);
      }

      if (status === apiSuccessCode) {
        if (response.config.responseReturn === 'raw') {
          return response;
        }
        if (response.config.responseReturn === 'body') {
          return response.data;
        }
        return response.data.Data;
      }

      if (PASSTHROUGH_ERROR_CODES.includes(status)) {
        return response;
      }

      if (LOGOUT_ERROR_CODES.includes(status)) {
        showLogoutModal(`${response.data.message || '登录已失效'}(${status})`);
        return Promise.reject(response.data);
      }

      if (status === FORCE_LOGOUT_CODE) {
        showLogoutModal('您的账号已在别处登录，请重新登录', true);
        return Promise.reject(response.data);
      }

      // 代客额度无账户/无权限：旧站静默 reject，由业务页提示并禁用操作
      if (status === 10_505) {
        return Promise.reject(response.data);
      }

      const errorMsg =
        mapErrorMessage(status, response.data.message) ||
        response.data.message ||
        '网络请求失败';
      message.error(errorMsg);
      return Promise.reject(response.data);
    },
    rejected: (error) => {
      message.error('网络请求超时，请稍后重试');
      return Promise.reject(error);
    },
  });

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = createRequestClient(apiURL, {
  responseReturn: 'raw',
});

export const voipRequestClient = voipBaseURL
  ? createRequestClient(voipBaseURL, {
      responseReturn: 'data',
    })
  : requestClient;
