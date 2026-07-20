import type {
  NetcashListQuery,
  NetcashListResult,
  ProxyGroupingListItem,
  ProxyGroupItem,
} from '#/types/netcash';

import { requestClient } from '#/api/request';

function normalizeList<T>(result: NetcashListResult<T> | null | undefined) {
  return {
    ...result,
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? {},
  };
}

export async function fetchProxyGroupListApi(
  query: Partial<NetcashListQuery> = {},
) {
  const result = await requestClient.get<NetcashListResult<ProxyGroupItem>>(
    '/backend/agentnetcashgroup/grouplist',
    { params: query },
  );
  return normalizeList(result);
}

export async function fetchProxyGroupingListApi(query: NetcashListQuery) {
  const result = await requestClient.get<
    NetcashListResult<ProxyGroupingListItem>
  >(
    '/backend/agentnetcashgroup/list',
    { params: query },
  );
  return normalizeList(result);
}

export function addAgentGroupApi(data: {
  GroupName: string;
  ParentId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashgroup', data);
}

export function deleteProxyGroupingApi(id: number | string) {
  return requestClient.delete(`/backend/agentnetcashgroup/${id}`);
}

export function updateProxyGroupingApi(data: {
  GroupName: string;
  Id: number | string;
  ParentId?: number | string;
}) {
  return requestClient.put('/backend/agentnetcashgroup', undefined, {
    params: data,
  });
}

export function moveProxyGroupingMembersApi(data: {
  AccountIds: string;
  ToGroupId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashgroup/move', data);
}

export function sortProxyGroupingApi(groups: ProxyGroupItem[]) {
  return requestClient.post('/backend/agentnetcashgroup/sort', {
    GroupJson: JSON.stringify({ Groups: groups }),
  });
}
