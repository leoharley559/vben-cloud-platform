import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  AgencyListItem,
  AgencyListQuery,
  AgencyRegisterItem,
  AgencyRegisterListQuery,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export async function fetchAgencyListApi(query: AgencyListQuery) {
  const result = await requestClient.get<CloudListResult<AgencyListItem> | null>(
    '/backend/agentnetcash/list',
    {
      params: trimSpace(query),
    },
  );
  return {
    ...(result || {}),
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
    Total: result?.Total || {},
  };
}

export function switchAgencyStatusApi(data: {
  AdminId: number | string;
  RemarkOnDeactivation: string;
  Status: number;
}) {
  return requestClient.put(
    '/backend/agentnetcash/switch',
    {},
    {
      params: data,
    },
  );
}

export function fetchAgencyRegisterListApi(query: AgencyRegisterListQuery) {
  return requestClient.get<CloudListResult<AgencyRegisterItem>>(
    '/backend/agentnetcashregister/list',
    { params: trimSpace(query) },
  );
}

export function approveAgencyRegisterApi(data: {
  Approve: number;
  Ids: number | string;
}) {
  return requestClient.post('/backend/agentnetcashregister/approve', data);
}

export function switchAgencyAutoAuditApi(data: { Enable: number | string }) {
  return requestClient.post('/backend/agentnetcashregister/auto', data);
}

export function fetchCountriesConfigListApi(query: Record<string, unknown>) {
  return requestClient.get<NetcashListResult>('/backend/countriesconfig/list', {
    params: query,
  });
}

export function fetchGameCountriesApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>('/backend/gamecountries/', {
    params: query,
  });
}

export function updateGameCountriesApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecountries/', data);
}

export function fetchDeveloperNamesListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashdevelopername/list',
    {
      params: trimSpace(query),
    },
  );
}

export function createDeveloperNameApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashdevelopername/add', data);
}

export function updateDeveloperNameApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashdevelopername/edit', data);
}

export function deleteDeveloperNameApi(data: { Id: number | string }) {
  return requestClient.delete('/backend/agentnetcashdevelopername/delete', {
    params: data,
  });
}

export function fetchAgencyPrincipalListApi(query: Record<string, unknown>) {
  return requestClient.get<NetcashListResult>('/backend/agentnetcash/list', {
    params: trimSpace(query),
  });
}

export function createAgencyApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash', data);
}

export function updateAgencyApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcash', data);
}

export function addAgencyPlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash/addplayer', data);
}

export async function checkAgencyPlayersApi(data: {
  AdminId: number | string;
  Players: string;
}) {
  const result = await requestClient.post<NetcashListResult | null>(
    '/backend/agentnetcash/checkplayers',
    data,
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}
