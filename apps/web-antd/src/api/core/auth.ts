import { baseRequestClient, requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';

export namespace AuthApi {
  /** cloudPlatform 登录参数（对齐 loginWeb.vue） */
  export interface LoginParams {
    /** 图形验证码内容 */
    PicNumber?: string;
    /** 密码（旧站字段） */
    Pwd?: string;
    /** 验证码时间戳/会话 */
    Timestamp?: string;
    /** 用户名（旧站字段） */
    UserName?: string;
    /** 密码（兼容字段） */
    password?: string;
    /** 用户名（兼容字段） */
    username?: string;
    [key: string]: unknown;
  }

  /** 登录结果（含二次验证态） */
  export interface LoginResult {
    /** 访问令牌；二次验证未完成时可为空 */
    accessToken: string;
    /** 登录账号 */
    account: string;
    /** 需要二次验证时有值 */
    loginType?: number;
    /** 脱敏手机号（二次验证提示用） */
    phoneMask?: string;
    /** 是否需要二次验证 */
    require2FA?: boolean;
  }

  /** 登录图形验证码 */
  export interface CaptchaResult {
    /** 验证码图片内容（base64/url 等） */
    Item: string;
    /** 验证码会话键 */
    KeyCode: string;
  }
}

/**
 * 用户名密码登录
 *
 * @param data 登录表单；兼容 `UserName/Pwd` 与 `username/password`；可带图形验证码 `PicNumber`、`Timestamp`
 * @returns accessToken / account；无 Token 时 `require2FA=true` 并带 phoneMask
 * @see 登录页 / 鉴权流程
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
 * 手机/二次验证登录（vlogin）
 *
 * @param data 二次验证提交参数（验证码、账号等）
 * @returns accessToken + account
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
 *
 * @returns 登出请求结果（走 baseRequestClient，不经过业务拦截器）
 */
export async function logoutApi() {
  return baseRequestClient.get('/public/user/logout');
}

/**
 * 获取用户权限码（对齐 GLOBAL.checkPermission：基于 Role.SubMenuIds）
 *
 * 从云后台 store 的 roles 展开菜单/操作权限 ID 字符串列表。
 *
 * @returns 权限码字符串数组（如 `"10634"`）
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
 * 获取登录图形验证码
 *
 * @returns Item 图片数据；KeyCode 验证码会话键
 */
export async function fetchLoginCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/public/user/captcha');
}

/**
 * 发送登录手机验证码
 *
 * @param data 发送验证码所需参数（账号/手机等）
 * @returns 发送结果
 */
export async function fetchPhoneCodeApi(data: Record<string, unknown>) {
  return requestClient.post('/public/user/sendcode', data);
}
