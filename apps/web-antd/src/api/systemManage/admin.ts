import { requestClient } from '#/api/request';
import type { AdminListQuery, AdminListResult } from '#/types/system-manage';
import { trimSpace } from '#/utils/string';

export function fetchAdminListApi(query: AdminListQuery) {
  return requestClient.get<AdminListResult>('/backend/sonuser/list', {
    params: trimSpace(query),
  });
}

export function fetchAdminDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/sonuser/${id}`);
}

export function createAdminApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sonuser/', data);
}

export function updateAdminApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/sonuser/', data);
}

export function deleteAdminApi(id: number | string, validCode: string) {
  return requestClient.delete(`/backend/sonuser/${id}`, {
    params: { ValidCode: validCode },
  });
}
