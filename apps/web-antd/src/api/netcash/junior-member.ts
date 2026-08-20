import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 下级会员列表响应（含合计 Total） */
export interface JuniorMemberListResult extends NetcashListResult {
  Pagination: NonNullable<NetcashListResult['Pagination']>;
  Total: Record<string, number>;
}

/**
 * 将下级会员列表响应归一为 JuniorMemberListResult。
 *
 * 保证 Pagination、Total 始终为对象，Items 始终为数组。
 *
 * @param result 接口原始响应
 * @returns 含 Items、Pagination 及 Total 的下级会员列表结构
 */
function normalizeListResult(
  result?: NetcashListResult | null,
): JuniorMemberListResult {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
    Total: result?.Total || {},
  };
}

/**
 * 下级会员列表（「下级会员」页主表格）。
 *
 * @param query 查询参数（代理、玩家账号、分页等）
 * @returns 下级会员 Items、Pagination 及 Total
 * @see views/netcash/juniorMember/index.vue
 */
export async function fetchJuniorMemberListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashplayerinfo/list',
    { params: trimSpace(query) },
  );
  return normalizeListResult(result);
}

/**
 * 下级会员归属变更记录。
 *
 * @param query 查询参数（玩家 Id、时间范围等）
 * @returns 变更记录 Items 及 Pagination
 * @see views/netcash/juniorMember/index.vue
 */
export async function fetchJuniorMemberChangeRecordApi(
  query: NetcashListQuery,
) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashplayerinfo/changerecord',
    { params: trimSpace(query) },
  );
  return normalizeListResult(result);
}

/**
 * 变更下级会员时可选的渠道列表。
 *
 * @param query 查询参数（代理 AdminId 等）
 * @returns 渠道选项数组
 * @see views/netcash/juniorMember/index.vue
 */
export async function fetchJuniorChangeChannelListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    Array<Record<string, unknown>> | Record<string, unknown>
  >('/backend/agentnetcashplayerinfo/channellist', { params: query });
  if (Array.isArray(result)) return result;
  return Array.isArray(result?.Items) ? result.Items : [];
}

/**
 * 变更下级会员所属代理或渠道。
 *
 * @param data 变更载荷（玩家 Id、目标 AdminId、ChannelId 等，经 query params 提交）
 * @returns 接口操作结果
 * @see views/netcash/juniorMember/index.vue
 */
export function changeJuniorAgentApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/agentnetcashplayerinfo',
    {},
    {
      params: data,
    },
  );
}

/**
 * 佣金算法模板选项（新建代理时选择下级算法，或下级会员页筛选用）。
 *
 * @returns 算法模板 Items 数组
 * @see views/netcash/agency/components/agency-form-modal.vue
 */
export async function fetchJuniorAlgorithmOptionsApi() {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/commissionalgorithmtemplate/list',
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

/**
 * 可选下级代理列表（批量导入/变更时选择目标代理）。
 *
 * @param query 查询参数（上级渠道等）
 * @returns 子推广员 ItemsSon 数组
 * @see views/netcash/juniorMember/index.vue
 */
export async function fetchJuniorAgentOptionsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<null | Record<string, unknown>>(
    '/backend/channel/listallsonpromoter',
    { params: trimSpace(query) },
  );
  return Array.isArray(result?.ItemsSon)
    ? (result.ItemsSon as Record<string, unknown>[])
    : [];
}

/**
 * 下级代理关联渠道列表。
 *
 * @param query 查询参数（AdminId、ChannelType 等）
 * @returns 渠道 Items 数组
 * @see views/netcash/juniorMember/index.vue
 */
export async function fetchJuniorAgentChannelsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/channel/list',
    { params: trimSpace(query) },
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

/**
 * 校验批量导入的下级玩家数据（提交前预检）。
 *
 * @param players 待导入玩家行数组
 * @returns 校验结果 Items（含错误提示字段）
 * @see views/netcash/juniorMember/index.vue
 */
export async function validateJuniorImportApi(
  players: Array<Record<string, unknown>>,
) {
  const result = await requestClient.post<NetcashListResult | null>(
    '/backend/agentnetcash/playerinfo',
    { Players: JSON.stringify(players) },
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

/**
 * 提交批量导入下级玩家。
 *
 * @param data AdminId 目标代理；Players JSON 字符串
 * @returns 接口操作结果
 * @see views/netcash/juniorMember/index.vue
 */
export function submitJuniorImportApi(data: {
  AdminId: number | string;
  Players: string;
}) {
  return requestClient.post('/backend/agentnetcash/addplayer', data);
}
