import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchAgentNetcashDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/agentnetcash/${id}`,
  );
}

export function fetchLoginInfoListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/accountlogininfo/list',
    { params: query },
  );
}

export function fetchWithdrawAgentListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/netcashwithdraw/agentlist',
    { params: trimSpace(query) },
  );
}

export function editAgentMobileApi(data: {
  Id: number | string;
  Mobile: string;
}) {
  return requestClient.put('/backend/agentnetcash/editmobile', data);
}

export function editAgentCommissionMoneyApi(data: {
  AdminId: number | string;
  Money: number;
}) {
  return requestClient.put('/backend/agentnetcash/moneymodify', data);
}

export function fetchAgentWithdrawAccountListApi(adminId: number | string) {
  return requestClient.get<Array<Record<string, unknown>> | NetcashListResult>(
    `/backend/netcashwithdrawaccount/${adminId}`,
  );
}

export function createAgentWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/netcashwithdrawaccount/', data);
}

export function updateAgentWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/netcashwithdrawaccount/editother', data);
}

export function deleteAgentWithdrawAccountApi(
  id: number | string,
  params: Record<string, unknown> = {},
) {
  return requestClient.delete(`/backend/netcashwithdrawaccount/${id}`, {
    params,
  });
}
