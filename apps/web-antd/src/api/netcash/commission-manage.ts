import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchCommTempListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/commissiontemplate/list',
    {
      params: query,
    },
  );
}

export function fetchCommListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/commissionconfig/list',
    { params: query },
  );
}

export function fetchVenueTemplateListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/apifeetemplate/list', {
    params: query,
  });
}

export function fetchVenueListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/apifeeconfig/list', {
    params: query,
  });
}

export function fetchSendCommListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/sendcommission/list', {
    params: trimSpace(query),
  });
}

export function fetchTeamCommListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/sendcommission/commissionlist',
    {
      params: trimSpace(query),
    },
  );
}

export function fetchCommAlgorithmDataApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/commissionalgorithm/list',
    {
      params: query,
    },
  );
}

export function fetchMultCommTempListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/commissiontemplatemulti/list',
    {
      params: query,
    },
  );
}

export function sendCommissionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sendcommission/sendcommission', data);
}

export function oneKeySendCommissionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sendcommission/onekeysend', data);
}

export function adjustCommissionApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/sendcommission/adjustmentcommission',
    data,
  );
}
