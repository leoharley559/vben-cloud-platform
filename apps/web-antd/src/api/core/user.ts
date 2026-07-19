import type { UserInfo } from '@vben/types';

import type { CloudUserData } from '#/types/cloud-platform';

import { requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { setCloudToken } from '#/utils/auth-token';

function toDisplayName(value: unknown, fallback = '') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function mapCloudUserToUserInfo(data: CloudUserData): UserInfo {
  const cloudStore = useCloudPlatformStore();
  cloudStore.setSessionData(data);
  setCloudToken(data.Token);

  // 后端 Account/AdminName 可能是 number，Avatar 的 alt 必须是 string
  const account =
    typeof data.Account === 'object'
      ? toDisplayName(data.Account.AdminId ?? data.Account.Id)
      : toDisplayName(data.Account);
  const displayName = toDisplayName(data.AdminName, account) || '管理员';

  return {
    avatar: '',
    desc: displayName,
    // 迁移期固定落到工作台，避免跳进尚未迁移的业务页
    homePath: '/workspace',
    realName: displayName,
    roles: (data.Role || []).map((role) => String(role.Name || role.Id || '')),
    token: data.Token,
    userId: account,
    username: account,
  };
}

/**
 * 获取用户信息（cloudPlatform: /public/user/islogin）
 */
export async function getUserInfoApi() {
  const data = await requestClient.get<CloudUserData>('/public/user/islogin');
  return mapCloudUserToUserInfo(data);
}
