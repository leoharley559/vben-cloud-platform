import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 将会员层级列表响应归一为 CloudListResult。
 *
 * 空 Items 时回退 `[]`，Pagination 保持接口原值（可为 undefined）。
 *
 * @param result 接口原始响应
 * @returns 含 Items 及 Pagination 的列表结构
 */
function normalizeList(
  result: CloudListResult<Record<string, unknown>> | null | undefined,
) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 分页查询会员层级列表。
 *
 * @param query 层级名称、状态等筛选及分页参数
 * @returns 会员层级 Items 与 Pagination
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 * @see views/operationalManage/playerList/components/player-level-modal.vue
 */
export async function fetchPlayerLevelListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/playerlevel/list', { params: trimSpace(query) });
  return normalizeList(result);
}

/**
 * 新增会员层级。
 *
 * @param data 层级名称、返水方案等表单字段
 * @returns 接口响应
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export function addPlayerLevelApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerlevel/add', data);
}

/**
 * 编辑会员层级。
 *
 * @param data 层级表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export function editPlayerLevelApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerlevel/edit', data);
}

/**
 * 删除会员层级。
 *
 * @param id 会员层级 ID
 * @returns 接口响应
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export function deletePlayerLevelApi(id: number | string) {
  return requestClient.delete(`/backend/playerlevel/${id}`);
}

/**
 * 分页查询某层级下的会员明细。
 *
 * @param query 层级 Id 及分页参数
 * @returns 层级会员 Items 与 Pagination
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
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

/**
 * 批量移除层级下的会员。
 *
 * @param data 层级 Id 及 PlayerIdsStr（逗号分隔玩家 ID）
 * @returns 接口响应
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export function deletePlayerLevelMembersApi(data: {
  Id: number | string;
  PlayerIdsStr: string;
}) {
  return requestClient.post('/backend/playerlevel/deletePlayerDetail', data);
}

/**
 * 获取全部返水方案下拉选项（allscheme 可能直接返回数组）。
 *
 * @returns 返水方案选项列表
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export async function fetchPlayerLevelSchemeOptionsApi() {
  const data = await requestClient.get<
    Record<string, unknown>[] | CloudListResult<Record<string, unknown>>
  >('/backend/playerbackwaterscheme/allscheme');
  if (Array.isArray(data)) {
    return data;
  }
  return data?.Items || [];
}
