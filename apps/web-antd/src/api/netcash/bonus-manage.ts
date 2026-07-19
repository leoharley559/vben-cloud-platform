import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

export function fetchBonusHistoryListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashbonus/list',
    { params: query },
  );
}

export function fetchBonusApproveListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashbonus/approvelist',
    {
      params: query,
    },
  );
}

export function approveBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus/approve', data);
}

export function provideBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus', data);
}

export function batchProvideBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus/batch', data);
}

export function queryBonusAdminIdApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus/queryadminid', data);
}

export function adjustBonusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashbonus', data);
}
