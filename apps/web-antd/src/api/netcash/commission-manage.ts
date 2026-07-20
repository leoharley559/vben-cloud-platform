import type {
  CommissionListResult,
  CommissionRow,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Payload = Record<string, unknown>;
type Query = Partial<NetcashListQuery> & Payload;

export function fetchCommTempListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissiontemplate/list',
    {
      params: query,
    },
  );
}

export function createCommTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissiontemplate/', data);
}

export function updateCommTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissiontemplate/', data);
}

export function deleteCommTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissiontemplate/${id}`);
}

export function fetchCommListApi(query: Query) {
  return requestClient.get<CommissionRow[]>(
    '/backend/commissionconfig/list',
    { params: query },
  );
}

export function createCommConfigApi(data: Payload) {
  return requestClient.post('/backend/commissionconfig/', data);
}

export function updateCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfig/', data);
}

export function deleteCommConfigApi(id: number | string) {
  return requestClient.delete(`/backend/commissionconfig/${id}`);
}

export function resetCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfig/resetdefault', data);
}

export function fetchVenueTemplateListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>('/backend/apifeetemplate/list', {
    params: query,
  });
}

export function createVenueTemplateApi(data: Payload) {
  return requestClient.post('/backend/apifeetemplate/', data);
}

export function updateVenueTemplateApi(data: Payload) {
  return requestClient.put('/backend/apifeetemplate/', data);
}

export function deleteVenueTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/apifeetemplate/${id}`);
}

export function fetchVenueListApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/apifeeconfig/list', {
    params: query,
  });
}

export function updateVenueConfigApi(data: Payload) {
  return requestClient.put('/backend/apifeeconfig/', data);
}

export function fetchSendCommListApi(query: Query) {
  return requestClient.get<CommissionListResult>('/backend/sendcommission/list', {
    params: trimSpace(query),
  });
}

export function fetchTeamCommListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/commissionlist',
    {
      params: trimSpace(query),
    },
  );
}

export const fetchPersonalCommListApi = fetchTeamCommListApi;

export function fetchCommAlgorithmDataApi(query: Query) {
  return requestClient.get<CommissionRow[]>(
    '/backend/commissionalgorithm/list',
    {
      params: query,
    },
  );
}

export function fetchAlgorithmTemplateListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissionalgorithmtemplate/list',
    { params: query },
  );
}

export function createAlgorithmTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissionalgorithmtemplate/', data);
}

export function updateAlgorithmTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithmtemplate/', data);
}

export function deleteAlgorithmTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissionalgorithmtemplate/${id}`);
}

export function updateAlgorithmApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithm/', data);
}

export function resetAlgorithmApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithm/resetdefault', data);
}

export function fetchMultCommTempListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissiontemplatemulti/list',
    {
      params: query,
    },
  );
}

export function createMultCommTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissiontemplatemulti/', data);
}

export function updateMultCommTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissiontemplatemulti/', data);
}

export function deleteMultCommTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissiontemplatemulti/${id}`);
}

export function fetchMultCommConfigApi(query: Query) {
  return requestClient.get<CommissionRow>('/backend/commissionconfigmulti/list', {
    params: query,
  });
}

export function updateMultCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfigmulti/', data);
}

export function resetMultCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfigmulti/resetdefault', data);
}

export function fetchPersonalDetailApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/sendcommission/personaldetail', {
    params: query,
  });
}

export function fetchTeamDetailApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/sendcommission/teamdetail', {
    params: query,
  });
}

export function fetchTeamListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/listadmin',
    { params: query },
  );
}

export function fetchCommissionInfoListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/commissioninfolist',
    { params: trimSpace(query) },
  );
}

export function sendCommissionApi(data: Payload) {
  return requestClient.post('/backend/sendcommission/sendcommission', data);
}

export function oneKeySendCommissionApi(data: Payload) {
  return requestClient.post('/backend/sendcommission/onekeysend', data);
}

export function adjustCommissionApi(data: Payload) {
  return requestClient.put(
    '/backend/sendcommission/adjustmentcommission',
    data,
  );
}
