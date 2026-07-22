import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeListResult(
  result: CloudListResult<Record<string, unknown>> | null | undefined,
): CloudListResult<Record<string, unknown>> {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination || {
      CurrPage: 1,
      MaxCount: 0,
      MaxPageCount: 1,
      PageSize: 20,
    },
  };
}

/**
 * 分页查询 IP/设备白名单列表。
 *
 * @param query 类型、IP、备注等筛选及分页参数
 * @returns 白名单 Items 与 Pagination
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export async function fetchWhiteListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/whitelist/list', { params: trimSpace(query) });
  return normalizeListResult(result);
}

/**
 * 分页查询白名单关联用户列表。
 *
 * @param query 白名单 Id 及分页参数
 * @returns 关联用户 Items 与 Pagination
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export async function fetchWhiteListUsersApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/whitelist/listuser', { params: trimSpace(query) });
  return normalizeListResult(result);
}

/**
 * 查询 IP / 使用者数量统计。
 *
 * @returns IpList、UserList
 * @see views/operationalManage/whiteList/index.vue
 */
export function fetchWhiteListStatsApi() {
  return requestClient.get<{ IpList?: number; UserList?: number }>(
    '/backend/whitelist/ipuserlist',
  );
}

/**
 * 新增 IP/设备白名单。
 *
 * @param data IP、类型、备注等表单字段
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function createWhiteListApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/whitelist', data);
}

/**
 * 编辑 IP/设备白名单。
 *
 * @param data 白名单表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function updateWhiteListApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/', data);
}

/**
 * 编辑白名单 IP 备注。
 *
 * @param data 白名单 Id 及备注内容
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function updateWhiteListRemarkApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/editipremark', data);
}

/**
 * 删除 IP/设备白名单。
 *
 * @param id 白名单 ID
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function deleteWhiteListApi(id: number | string) {
  return requestClient.delete(`/backend/whitelist/${id}`);
}

/**
 * 新增白名单关联用户。
 *
 * @param data 白名单 Id 及用户账号等
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function createWhiteListUserApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/whitelist/adduser', data);
}

/**
 * 编辑白名单关联用户（含状态开关）。
 *
 * @param data 用户记录表单数据（含 Id、Status）
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function updateWhiteListUserApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/edituser', data);
}

/**
 * 编辑白名单关联用户备注。
 *
 * @param data 用户记录 Id 及备注内容
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function updateWhiteListUserRemarkApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/whitelist/edituserremark', data);
}

/**
 * 删除白名单关联用户。
 *
 * @param id 用户关联记录 ID
 * @returns 接口响应
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function deleteWhiteListUserApi(id: number | string) {
  return requestClient.delete(`/backend/whitelist/deluser/${id}`);
}

/**
 * 查询可添加到白名单的用户候选列表。
 *
 * @param query 可选搜索及分页参数
 * @returns 候选用户列表或 Items
 * @see views/operationalManage/whiteList/components/white-list-panel.vue
 */
export function fetchWhiteListPickUsersApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<
    CloudListResult<Record<string, unknown>> | Record<string, unknown>[]
  >('/backend/whitelist/pickuser', { params: query });
}
