import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将团队管理列表响应归一为 NetcashListResult。
 *
 * 保留响应中的其他字段，并确保 Items 为数组、Pagination 有默认值。
 *
 * @param result 接口原始响应
 * @returns 含 Items 及 Pagination 的列表结构
 */
function normalizeList(result?: NetcashListResult | null) {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
  };
}

/**
 * 代理团队列表（「团队管理」页主表格）。
 *
 * @param query 查询参数（团队名、负责人、分页等）
 * @returns 团队行 Items 及 Pagination
 * @see views/netcash/teamManage/index.vue
 */
export async function fetchTeamListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteam/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 团队变更记录列表（团队管理页查看历史操作）。
 *
 * @param query 查询参数（团队 Id、时间范围等）
 * @returns 变更记录 Items 及 Pagination
 * @see views/netcash/teamManage/index.vue
 */
export async function fetchTeamRecordListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteam/record',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 可选团队负责人列表（新建/编辑团队时选择主账号）。
 *
 * @param query 查询参数（账号、状态等筛选）
 * @returns 代理账号 Items 及 Pagination
 * @see views/netcash/teamManage/index.vue
 */
export async function fetchTeamPrincipalListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcash/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 新建代理团队。
 *
 * @param data 团队表单（名称、负责人 AdminId 等）
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function createTeamApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashteam/', data);
}

/**
 * 更新代理团队信息。
 *
 * @param data 团队表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function updateTeamApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashteam/', data);
}

/**
 * 解散代理团队。
 *
 * @param id 团队 Id
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function dissolveTeamApi(id: number | string) {
  return requestClient.delete(`/backend/agentnetcashteam/${id}`);
}

/**
 * 添加团队副手成员。
 *
 * @param data AdminId 副手账号；TeamId 目标团队
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function addTeamDeputyApi(data: {
  AdminId: number | string;
  TeamId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashteamdeputy/', data);
}

/**
 * 团队副手成员列表。
 *
 * @param query 查询参数（TeamId 等）
 * @returns 副手成员 Items 及 Pagination
 * @see views/netcash/teamManage/index.vue
 */
export async function fetchTeamDeputyListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashteamdeputy/list',
    { params: query },
  );
  return normalizeList(result);
}

/**
 * 移除团队副手成员。
 *
 * @param adminId 副手 AdminId
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function removeTeamDeputyApi(adminId: number | string) {
  return requestClient.delete(`/backend/agentnetcashteamdeputy/${adminId}`);
}

/**
 * 将副手从一个团队迁移到另一个团队。
 *
 * @param data AdminId、FromTeamId、ToTeamId
 * @returns 接口操作结果
 * @see views/netcash/teamManage/index.vue
 */
export function moveTeamDeputyApi(data: {
  AdminId: number | string;
  FromTeamId: number | string;
  ToTeamId: number | string;
}) {
  return requestClient.post('/backend/agentnetcashteamdeputy/move', data);
}
