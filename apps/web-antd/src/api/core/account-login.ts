import { requestClient } from '#/api/request';

/** 个人中心账号资料 */
export interface AccountLoginInfo {
  [key: string]: unknown;
  Address?: string;
  CloudCoin?: number | string;
  Count?: number | string;
  CreateTime?: number | string;
  Ip?: string;
  IsAllowOtherDeviceLogin?: number | string;
  IsSetPrivatePassword?: number | string;
  LoginType?: number | string;
  Name?: string;
  Phone?: string;
  PrivatePassword?: string;
  Scores?: number | string;
  Username?: string;
}

/** 登录记录项 */
export interface AccountLoginLogItem {
  [key: string]: unknown;
  Address?: string;
  CreateTime?: number | string;
  Ip?: string;
}

export interface AccountLoginLogResult {
  Item?: AccountLoginLogItem[];
  Items?: AccountLoginLogItem[];
  Pagination?: {
    MaxCount?: number;
    Page?: number;
    PageSize?: number;
  };
}

/**
 * 获取个人中心基础资料
 * @see cloudPlatform personalCenter
 */
export function fetchAccountLoginInfoApi() {
  return requestClient.get<AccountLoginInfo>('/backend/accountlogin/info');
}

/**
 * 修改昵称
 */
export function updateAccountNameApi(data: { Name: string }) {
  return requestClient.post('/backend/accountlogin/name', data);
}

/**
 * 修改登录密码
 */
export function updateAccountPasswordApi(data: {
  ConfirmPassword: string;
  NewPassword: string;
  OldPassword: string;
}) {
  return requestClient.post('/backend/accountlogin/password', data);
}

/**
 * 修改私人密码
 */
export function updatePrivatePasswordApi(data: {
  ConfirmPassword: string;
  NewPassword: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/privatepassword', data);
}

/**
 * 绑定/解绑谷歌验证（LoginType 1↔3）
 */
export function updateAccountLoginSettingApi(data: {
  LoginType: number;
  ValidCode: string;
}) {
  return requestClient.post('/backend/accountlogin/loginsetting', data);
}

/**
 * 多设备登录开关
 */
export function updateMultiDeviceLoginApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/accountlogin/multipledevicelogin', data);
}

/**
 * 绑定手机
 */
export function bindAccountPhoneApi(data: {
  AreaCode: string;
  Phone: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/phone', data);
}

/**
 * 解绑手机
 */
export function unbindAccountPhoneApi(data: { VerifyCode: string }) {
  return requestClient.post('/backend/accountlogin/deletephone', data);
}

/**
 * 获取短信验证码
 */
export function fetchPhoneValidCodeApi(params?: { Number?: string }) {
  return requestClient.get('/api/phonevalidcode/', { params });
}

/**
 * 获取登录记录
 */
export function fetchAccountLoginLogListApi(query: {
  Page: number;
  PageSize: number;
}) {
  return requestClient.get<AccountLoginLogResult>(
    '/backend/accountlogin/loglist',
    { params: query },
  );
}

/**
 * 获取谷歌验证器绑定二维码/密钥
 */
export function fetchGoogleAuthSecretApi(data: { Username: string }) {
  return requestClient.post<{ QrCode?: string; Secret?: string }>(
    '/public/user/getgoogleauthsecret',
    data,
  );
}
