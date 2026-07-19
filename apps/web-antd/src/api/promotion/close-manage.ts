import { requestClient } from '#/api/request';
import type {
  CloseManageListQuery,
  CloseManageListResult,
  WithdrawAccountItem,
  WithdrawPayload,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchCloseManageListApi(query: CloseManageListQuery) {
  return requestClient.get<CloseManageListResult>(
    '/backend/accountteamwithdraw/list',
    { params: trimSpace(query) },
  );
}

export function fetchWithdrawUserInfoApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/accountlogin/info',
  );
}

export function fetchWithdrawAccountListApi() {
  return requestClient.get<{ Items?: WithdrawAccountItem[] }>(
    '/backend/accountteambank/list',
  );
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
