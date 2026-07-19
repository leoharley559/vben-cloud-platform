import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

export function fetchProxyGroupListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashgroup/grouplist',
    { params: query },
  );
}

export function fetchProxyGroupingListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashgroup/list',
    { params: query },
  );
}

export function addAgentGroupApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashgroup', data);
}

export function deleteProxyGroupingApi(id: number | string) {
  return requestClient.delete(`/backend/agentnetcashgroup/${id}`);
}
