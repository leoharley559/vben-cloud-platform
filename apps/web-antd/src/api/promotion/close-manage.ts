import type {
  CloseManageListQuery,
  CloseManageListResult,
  WithdrawAccountItem,
  WithdrawPayload,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

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

export function fetchWithdrawUserInfoApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/accountlogin/info',
  );
}

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

export function createWithdrawApi(data: WithdrawPayload) {
  return requestClient.post('/backend/accountteamwithdraw/', data);
}

export function createWithdrawAccountApi(data: WithdrawAccountItem) {
  return requestClient.post('/backend/accountteambank/', data);
}

export function fetchWithdrawAccountDetailApi(id: number | string) {
  return requestClient.get<WithdrawAccountItem>(
    `/backend/accountteambank/${id}`,
  );
}

export function updateWithdrawAccountApi(data: WithdrawAccountItem) {
  return requestClient.put('/backend/accountteambank/', data);
}

export function deleteWithdrawAccountApi(id: number | string) {
  return requestClient.delete(`/backend/accountteambank/${id}`);
}

export function fetchWithdrawPhoneCodeApi() {
  return requestClient.get('/api/phonevalidcode/');
}

export function fetchSecurityPhoneCodeApi(params?: { Number?: string }) {
  return requestClient.get('/api/phonevalidcode/', { params });
}

export function updatePrivatePasswordApi(data: {
  ConfirmPassword: string;
  NewPassword: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/privatepassword', data);
}

export function bindAccountPhoneApi(data: {
  AreaCode: string;
  Phone: string;
  VerifyCode: string;
}) {
  return requestClient.post('/backend/accountlogin/phone', data);
}

export function unbindAccountPhoneApi(data: { VerifyCode: string }) {
  return requestClient.post('/backend/accountlogin/deletephone', data);
}
