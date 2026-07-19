import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchWhiteListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/whitelist/list',
    { params: trimSpace(query) },
  );
}

export function fetchWhiteListUsersApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/whitelist/listuser',
    { params: query },
  );
}

export function createWhiteListApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/whitelist', data);
}

export function updateWhiteListApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/', data);
}

export function updateWhiteListRemarkApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/editipremark', data);
}

export function deleteWhiteListApi(id: number | string) {
  return requestClient.delete(`/backend/whitelist/${id}`);
}

export function createWhiteListUserApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/whitelist/adduser', data);
}

export function updateWhiteListUserApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/edituser', data);
}

export function updateWhiteListUserRemarkApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/edituserremark', data);
}

export function deleteWhiteListUserApi(id: number | string) {
  return requestClient.delete(`/backend/whitelist/deluser/${id}`);
}

export function fetchWhiteListPickUsersApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<
    CloudListResult<Record<string, unknown>> | Record<string, unknown>[]
  >('/backend/whitelist/pickuser', { params: query });
}
