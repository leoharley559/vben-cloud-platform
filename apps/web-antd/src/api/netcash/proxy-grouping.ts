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

/**
 * 代理分组树列表（「代理分组」页左侧分组树）。
 *
 * @param query 查询参数（可选 ParentId 等）
 * @returns 分组节点 Items 及 Pagination
 * @see views/netcash/proxyGrouping/index.vue
 */
export async function fetchProxyGroupListApi(
  query: Partial<NetcashListQuery> = {},
) {
  const result = await requestClient.get<NetcashListResult<ProxyGroupItem>>(
    '/backend/agentnetcashgroup/grouplist',
    { params: query },
  );
  return normalizeList(result);
}

/**
 * 分组内代理成员列表（「代理分组」页右侧成员表格）。
 *
 * @param query 查询参数（GroupId、账号、分页等）
 * @returns 成员行 Items 及 Pagination
 * @see views/netcash/proxyGrouping/index.vue
 */
export async function fetchProxyGroupingListApi(query: NetcashListQuery) {
  const result = await requestClient.get<
    NetcashListResult<ProxyGroupingListItem>
  >(
    '/backend/agentnetcashgroup/list',
    { params: query },
  );
  return normalizeList(result);
}

/**
 * 新建代理分组。
 *
 * @param data GroupName 分组名；ParentId 父分组 Id
 * @returns 接口操作结果
 * @see views/netcash/proxyGrouping/index.vue
 */
export function addAgentGroupApi(data: {
  GroupName: string;
  ParentId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashgroup', data);
}

/**
 * 删除代理分组。
 *
 * @param id 分组 Id
 * @returns 接口操作结果
 * @see views/netcash/proxyGrouping/index.vue
 */
export function deleteProxyGroupingApi(id: number | string) {
  return requestClient.delete(`/backend/agentnetcashgroup/${id}`);
}

/**
 * 更新代理分组名称或父级。
 *
 * @param data Id、GroupName；可选 ParentId
 * @returns 接口操作结果
 * @see views/netcash/proxyGrouping/index.vue
 */
export function updateProxyGroupingApi(data: {
  GroupName: string;
  Id: number | string;
  ParentId?: number | string;
}) {
  return requestClient.put('/backend/agentnetcashgroup', undefined, {
    params: data,
  });
}

/**
 * 批量移动代理到目标分组。
 *
 * @param data AccountIds 逗号分隔账号 Id；ToGroupId 目标分组
 * @returns 接口操作结果
 * @see views/netcash/proxyGrouping/index.vue
 */
export function moveProxyGroupingMembersApi(data: {
  AccountIds: string;
  ToGroupId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashgroup/move', data);
}

/**
 * 保存代理分组排序（拖拽后提交整棵分组树顺序）。
 *
 * @param groups 排序后的分组节点数组
 * @returns 接口操作结果
 * @see views/netcash/proxyGrouping/index.vue
 */
export function sortProxyGroupingApi(groups: ProxyGroupItem[]) {
  return requestClient.post('/backend/agentnetcashgroup/sort', {
    GroupJson: JSON.stringify({ Groups: groups }),
  });
}
