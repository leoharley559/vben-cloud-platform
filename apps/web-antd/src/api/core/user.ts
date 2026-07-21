import type { UserInfo } from '@vben/types';

import type { CloudUserData } from '#/types/cloud-platform';

import { requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { setCloudToken } from '#/utils/auth-token';

/**
 * 将任意值转为可展示的字符串名称
 * @param value 原始值（可为 number、string 等）
 * @param fallback 空值时的默认回退字符串
 * @returns 非空时转为 string，否则返回 fallback
 */
function toDisplayName(value: unknown, fallback = '') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

/**
 * 将云后台登录用户数据映射为 Vben UserInfo，并写入 session / Token
 * @param data 云后台 islogin 接口返回的用户数据
 * @returns 前端鉴权与布局所需的 UserInfo 对象
 */
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
 * 获取当前登录用户信息（并写入云后台 session / Token）
 *
 * @returns 映射后的 Vben UserInfo（avatar、homePath、roles、token 等）
 * @see store/cloud-platform；登录后鉴权与菜单加载前置
 */
export async function getUserInfoApi() {
  const data = await requestClient.get<CloudUserData>('/public/user/islogin');
  return mapCloudUserToUserInfo(data);
}
