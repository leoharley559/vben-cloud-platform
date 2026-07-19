import { requestClient } from '#/api/request';
import type { HelpCenterItem, HelpCenterListQuery } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchHelpCenterListApi(query: HelpCenterListQuery) {
  return requestClient.get<{ Items?: HelpCenterItem[] }>(
    '/backend/helpcenter/list',
    { params: trimSpace(query) },
  );
}

export function createHelpCenterApi(data: HelpCenterItem) {
  return requestClient.post('/backend/helpcenter', data);
}

export function updateHelpCenterApi(data: HelpCenterItem) {
  return requestClient.put('/backend/helpcenter', data);
}

export function deleteHelpCenterApi(id: number | string) {
  return requestClient.delete(`/backend/helpcenter/${id}`);
}

export function sortHelpCenterApi(data: {
  Id1?: number | string;
  Id2?: number | string;
}) {
  return requestClient.put(
    '/backend/helpcenter/switchSort',
    {},
    {
      params: data,
    },
  );
}
