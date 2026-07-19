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

export function fetchAgencyListApi(query: AgencyListQuery) {
  return requestClient.get<CloudListResult<AgencyListItem>>(
    '/backend/agentnetcash/list',
    {
      params: trimSpace(query),
    },
  );
}

export function switchAgencyStatusApi(data: {
  Id?: number | string;
  Status?: number;
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
  Id?: number | string;
  IsAccept?: number;
}) {
  return requestClient.post('/backend/agentnetcashregister/approve', data);
}

export function switchAgencyAutoAuditApi(data: { AutoApprove?: number }) {
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

export function createAgencyApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash', data);
}

export function updateAgencyApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcash', data);
}

export function addAgencyPlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash/addplayer', data);
}
