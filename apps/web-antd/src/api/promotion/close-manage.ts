import type {
  CloseManageListQuery,
  CloseManageListResult,
  WithdrawAccountItem,
  WithdrawPayload,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取结算管理列表
 * @param query 分页与筛选条件
 * @returns 结算记录列表、汇总及分页信息
 * @see views/generalizeManage/closeManage/index.vue
 * @see views/mobile/earning/bill/index.vue
 */
export async function fetchCloseManageListApi(query: CloseManageListQuery) {
  const data = await requestClient.get<CloseManageListResult | null>(
    '/backend/accountteamwithdraw/list',
    { params: trimSpace(query) },
  );
  return {
    Items: data?.Items || [],
    MoreItems: data?.MoreItems || {},
    Pagination: data?.Pagination,
  };
}

/**
 * 获取当前登录用户的提现账户信息
 * @returns 用户账户余额、手机号等提现相关信息
 * @see views/generalizeManage/closeManage/index.vue
 * @see views/mobileCloud/user/index.vue
 * @see views/mobile/earning/index.vue
 */
export function fetchWithdrawUserInfoApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/accountlogin/info',
  );
}

/**
 * 获取提现收款账户列表
 * @returns 已绑定的银行卡/收款账户列表
 * @see views/generalizeManage/closeManage/index.vue
 * @see views/generalizeManage/teamWithdrawAccount/index.vue
 * @see views/mobile/earning/withdrawAccount/index.vue
 */
export async function fetchWithdrawAccountListApi() {
  const data = await requestClient.get<
    null | WithdrawAccountItem[] | { Items?: WithdrawAccountItem[] }
  >(
    '/backend/accountteambank/list',
  );
  return {
    Items: Array.isArray(data) ? data : data?.Items || [],
  };
}

/**
 * 发起提现申请
 * @param data 提现金额与收款账户信息
 * @returns 提现申请结果
 * @see views/generalizeManage/closeManage/components/withdraw-modal.vue
 */
export function createWithdrawApi(data: WithdrawPayload) {
  return requestClient.post('/backend/accountteamwithdraw/', data);
}

/**
 * 新增提现收款账户
 * @param data 收款账户表单数据
 * @returns 创建结果
 * @see views/generalizeManage/closeManage/components/withdraw-account-modal.vue
 */
export function createWithdrawAccountApi(data: WithdrawAccountItem) {
  return requestClient.post('/backend/accountteambank/', data);
}

/**
 * 获取提现收款账户详情
 * @param id 收款账户 ID
 * @returns 收款账户详细信息
 * @see views/generalizeManage/closeManage/components/withdraw-account-modal.vue
 */
export function fetchWithdrawAccountDetailApi(id: number | string) {
  return requestClient.get<WithdrawAccountItem>(
    `/backend/accountteambank/${id}`,
  );
}

/**
 * 更新提现收款账户
 * @param data 收款账户表单数据（含 ID）
 * @returns 更新结果
 * @see views/generalizeManage/closeManage/components/withdraw-account-modal.vue
 */
export function updateWithdrawAccountApi(data: WithdrawAccountItem) {
  return requestClient.put('/backend/accountteambank/', data);
}

/**
 * 删除提现收款账户
 * @param id 收款账户 ID
 * @returns 删除结果
 * @see views/generalizeManage/closeManage/components/withdraw-account-modal.vue
 * @see views/generalizeManage/teamWithdrawAccount/index.vue
 */
export function deleteWithdrawAccountApi(id: number | string) {
  return requestClient.delete(`/backend/accountteambank/${id}`);
}

/**
 * 获取提现验证码
 * @returns 手机验证码发送结果
 * @see views/generalizeManage/closeManage/components/withdraw-modal.vue
 */
export function fetchWithdrawPhoneCodeApi() {
  return requestClient.get('/api/phonevalidcode/');
}

/**
 * 获取安全设置验证码
 * @param params 可选手机号参数
 * @returns 手机验证码发送结果
 * @see views/generalizeManage/closeManage/components/security-setting-modal.vue
 */
export function fetchSecurityPhoneCodeApi(params?: { Number?: string }) {
  return requestClient.get('/api/phonevalidcode/', { params });
}

/**
 * 修改私密密码
 * @param data 新密码、确认密码及验证码
 * @returns 修改结果
 * @see views/generalizeManage/closeManage/components/security-setting-modal.vue
 */
export function updatePrivatePasswordApi(data: {
  ConfirmPassword: string;
  NewPassword: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/privatepassword', data);
}

/**
 * 绑定手机号
 * @param data 区号、手机号及验证码
 * @returns 绑定结果
 * @see views/generalizeManage/closeManage/components/security-setting-modal.vue
 */
export function bindAccountPhoneApi(data: {
  AreaCode: string;
  Phone: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/phone', data);
}

/**
 * 解绑手机号
 * @param data 验证码
 * @returns 解绑结果
 * @see views/generalizeManage/closeManage/components/security-setting-modal.vue
 */
export function unbindAccountPhoneApi(data: { VerifyCode: string }) {
  return requestClient.post('/backend/accountlogin/deletephone', data);
}
