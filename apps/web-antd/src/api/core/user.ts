import type { UserInfo } from '@vben/types';

import type { CloudUserData } from '#/types/cloud-platform';

import { requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { setCloudToken } from '#/utils/auth-token';
import { resolveHomePathFromNav } from '#/utils/menu-adapter';

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

  // 与旧 Navbar 一致：优先展示 Admin.Username
  const adminUsername = toDisplayName(
    data.Admin && typeof data.Admin === 'object'
      ? data.Admin.Username
      : undefined,
  );
  const account =
    data.Account !== null && typeof data.Account === 'object'
      ? toDisplayName(
          data.Account.Username ?? data.Account.AdminId ?? data.Account.Id,
        )
      : toDisplayName(data.Account);
  const displayName =
    toDisplayName(data.AdminName, adminUsername || account) || '管理员';
  const username = adminUsername || account || displayName;
  const avatar = toDisplayName(
    (data.Admin && typeof data.Admin === 'object'
      ? data.Admin.Avatar
      : undefined) ?? data.Avatar,
  );

  return {
    // 空字符串由布局侧 || defaultAvatar 回退
    avatar,
    desc: displayName,
    // 先按 Nav 估一个首页，GenerateRoutes 后会改成左侧第一个可见菜单
    homePath: resolveHomePathFromNav(data.Nav || [], cloudStore.projectConfig),
    realName: displayName,
    roles: (data.Role || []).map((role) => String(role.Name || role.Id || '')),
    token: data.Token,
    userId: account || username,
    username,
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
