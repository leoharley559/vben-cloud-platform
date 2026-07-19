import { baseRequestClient, requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';

export namespace AuthApi {
  /** cloudPlatform 登录参数（对齐 loginWeb.vue） */
  export interface LoginParams {
    PicNumber?: string;
    Pwd?: string;
    Timestamp?: string;
    UserName?: string;
    password?: string;
    username?: string;
    [key: string]: unknown;
  }

  export interface LoginResult {
    accessToken: string;
    account: string;
    /** 需要二次验证时有值 */
    loginType?: number;
    phoneMask?: string;
    require2FA?: boolean;
  }

  export interface CaptchaResult {
    Item: string;
    KeyCode: string;
  }
}

/**
 * 用户名密码登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const payload = {
    PicNumber: data.PicNumber || '',
    Pwd: data.Pwd || data.password || '',
    Timestamp: data.Timestamp || '',
    UserName: (data.UserName || data.username || '').trim(),
  };

  const result = await requestClient.post<{
    Account?: string;
    LoginType?: number;
    Number?: string;
    Token?: string;
  }>('/public/user/login', payload);

  if (!result?.Token) {
    return {
      accessToken: '',
      account: payload.UserName,
      loginType: result?.LoginType,
      phoneMask: result?.Number ? result.Number.split('_')[1] : '',
      require2FA: true,
    } satisfies AuthApi.LoginResult;
  }

  return {
    accessToken: result.Token,
    account: result.Account || payload.UserName,
  } satisfies AuthApi.LoginResult;
}

/**
 * 手机/二次验证登录
 */
export async function loginByPhoneApi(data: Record<string, unknown>) {
  const result = await requestClient.post<{
    Account: string;
    Token: string;
  }>('/public/user/vlogin', data);

  return {
    accessToken: result.Token,
    account: result.Account,
  } satisfies AuthApi.LoginResult;
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.get('/public/user/logout');
}

/**
 * 获取用户权限码（对齐 GLOBAL.checkPermission：基于 Role.SubMenuIds）
 */
export async function getAccessCodesApi() {
  const cloudStore = useCloudPlatformStore();
  const codes = new Set<string>();

  for (const role of cloudStore.roles) {
    const raw = role.SubMenuIds;
    if (Array.isArray(raw)) {
      for (const id of raw) {
        codes.add(String(id));
      }
      continue;
    }
    if (typeof raw === 'string' && raw) {
      for (const id of raw.split(',')) {
        const trimmed = id.trim();
        if (trimmed) {
          codes.add(trimmed);
        }
      }
      continue;
    }
    if (raw !== undefined && raw !== null && raw !== '') {
      codes.add(String(raw));
    }
  }

  return [...codes];
}

/**
 * 获取图形验证码
 */
export async function fetchLoginCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/public/user/captcha');
}

/**
 * 获取手机验证码
 */
export async function fetchPhoneCodeApi(data: Record<string, unknown>) {
  return requestClient.post('/public/user/sendcode', data);
}
