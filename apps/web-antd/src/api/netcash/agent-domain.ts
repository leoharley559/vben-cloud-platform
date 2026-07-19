import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

export function fetchAgentDomainListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentchanneldomain/list',
    { params: query },
  );
}

export function updateAgentDomainApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentchanneldomain/', data);
}
