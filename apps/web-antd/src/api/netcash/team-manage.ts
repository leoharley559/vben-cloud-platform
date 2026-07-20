import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

function normalizeList(result?: NetcashListResult | null) {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
  };
}

export async function fetchTeamListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteam/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export async function fetchTeamRecordListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteam/record',
    { params: query },
  );
  return normalizeList(result);
}

export async function fetchTeamPrincipalListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<NetcashListResult | null>('/backend/agentnetcash/list', {
    params: trimSpace(query),
  });
  return normalizeList(result);
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

export async function fetchTeamDeputyListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteamdeputy/list',
    { params: query },
  );
  return normalizeList(result);
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
