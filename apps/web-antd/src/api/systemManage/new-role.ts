import { requestClient } from '#/api/request';
import type {
  RoleFormModel,
  RoleListQuery,
  RoleListResult,
} from '#/types/system-manage';
import { trimSpace } from '#/utils/string';

export function fetchRoleListApi(query: RoleListQuery) {
  return requestClient.get<RoleListResult>('/public/rolenew/list', {
    params: trimSpace(query),
  });
}

export function fetchRoleDetailApi(id: number | string) {
  return requestClient.get<RoleFormModel>(`/public/rolenew/${id}`);
}

export function createRoleApi(data: Record<string, unknown>) {
  return requestClient.post('/public/rolenew/', data);
}

export function updateRoleApi(data: Record<string, unknown>) {
  return requestClient.put('/public/rolenew/', data);
}

export function deleteRoleApi(id: number | string) {
  return requestClient.delete(`/public/rolenew/${id}`);
}

export function fetchRoleParamListApi(params: Record<string, unknown>) {
  return requestClient.get('/public/roleparams/list', { params });
}

export function saveRoleParamApi(data: Record<string, unknown>) {
  return requestClient.put('/public/roleparams/', data);
}
