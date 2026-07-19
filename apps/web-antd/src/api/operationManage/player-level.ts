import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeList(
  result: CloudListResult<Record<string, unknown>> | null | undefined,
) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchPlayerLevelListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/playerlevel/list', { params: trimSpace(query) });
  return normalizeList(result);
}

export function addPlayerLevelApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerlevel/add', data);
}

export function editPlayerLevelApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerlevel/edit', data);
}

export function deletePlayerLevelApi(id: number | string) {
  return requestClient.delete(`/backend/playerlevel/${id}`);
}

export async function fetchPlayerLevelMembersApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/playerlevel/listPlayerDetail', {
    params: trimSpace(query),
  });
  return normalizeList(result);
}

/** 批量移除层级下会员 */
export function deletePlayerLevelMembersApi(data: {
  Id: number | string;
  PlayerIdsStr: string;
}) {
  return requestClient.post('/backend/playerlevel/deletePlayerDetail', data);
}

/** allscheme 可能直接返回数组 */
export async function fetchPlayerLevelSchemeOptionsApi() {
  const data = await requestClient.get<
    Record<string, unknown>[] | CloudListResult<Record<string, unknown>>
  >('/backend/playerbackwaterscheme/allscheme');
  if (Array.isArray(data)) {
    return data;
  }
  return data?.Items || [];
}
