import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchPlayerGoldHandleListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playergoldhandle/list',
    { params: trimSpace(query) },
  );
}

export function createPlayerGoldHandleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/', data);
}

export function batchCreatePlayerGoldHandleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/batch', data);
}

export function getPlayerGoldRedTitleApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playergoldhandle/redtitle',
  );
}
