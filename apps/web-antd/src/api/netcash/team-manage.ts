import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchTeamListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashteam/list',
    { params: trimSpace(query) },
  );
}

export function fetchTeamRecordListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashteam/record',
    { params: query },
  );
}

export function createTeamApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashteam/', data);
}

export function updateTeamApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashteam/', data);
}

export function dissolveTeamApi(id: number | string) {
  return requestClient.delete(`/backend/agentnetcashteam/${id}`);
}

export function addTeamDeputyApi(data: {
  AdminId: number | string;
  TeamId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashteamdeputy/', data);
}

export function fetchTeamDeputyListApi(query: Record<string, unknown>) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashteamdeputy/list',
    { params: query },
  );
}

export function removeTeamDeputyApi(adminId: number | string) {
  return requestClient.delete(`/backend/agentnetcashteamdeputy/${adminId}`);
}

export function moveTeamDeputyApi(data: {
  AdminId: number | string;
  FromTeamId: number | string;
  ToTeamId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashteamdeputy/move', data);
}
