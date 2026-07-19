import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchDrawmoneyListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/netcashwithdraw/list', {
    params: trimSpace(query),
  });
}

export function orderOperateApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/netcashwithdraw/operate',
    {},
    {
      params: data,
    },
  );
}

export function fetchDrawmoneyBlacklistApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/netcashwithdraw/blacklist',
    {
      params: trimSpace(query),
    },
  );
}

export function addDrawmoneyBlackApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/netcashwithdraw/addblack', data);
}

export function editDrawmoneyBlackApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/netcashwithdraw/editblack', data);
}

export function deleteDrawmoneyAccountApi(id: number | string) {
  return requestClient.delete(`/backend/netcashwithdraw/delblack/${id}`);
}

export function fetchDrawingsChannelSettingListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/netcashwithdraw/managelist',
    {
      params: trimSpace(query),
    },
  );
}
