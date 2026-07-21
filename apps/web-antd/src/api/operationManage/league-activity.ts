import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';

function normalizeCloudList<T>(data: unknown): CloudListResult<T> {
  if (Array.isArray(data)) {
    return { Items: data as T[] };
  }
  if (data && typeof data === 'object') {
    const record = data as CloudListResult<T> & { Data?: CloudListResult<T> };
    if (Array.isArray(record.Items) || record.Pagination) {
      return {
        ...record,
        Items: (record.Items || []) as T[],
      };
    }
    if (
      record.Data &&
      (Array.isArray(record.Data.Items) || record.Data.Pagination)
    ) {
      return {
        ...record.Data,
        Items: (record.Data.Items || []) as T[],
      };
    }
  }
  return { Items: [] };
}

function normalizeCloudObject<T extends Record<string, unknown>>(
  data: unknown,
): T | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown> & { Items?: unknown };
  if (
    record.Items &&
    typeof record.Items === 'object' &&
    !Array.isArray(record.Items)
  ) {
    return record.Items as T;
  }
  if (Array.isArray(record.Items)) {
    return (record.Items[0] as T) || null;
  }
  return record as T;
}

/**
 * 分页查询联赛活动（杯赛专题）列表。
 *
 * @param query 筛选条件及分页参数
 * @returns 联赛活动 Items 与 Pagination
 * @see views/operationalManage/customLeague/index.vue
 */
export function fetchCustomLeagueListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gamecustomleague/list',
      { params: query },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 根据场馆/赛事类型获取可选联赛赛事列表。
 *
 * @param query GameType 场馆类型、SportId 赛事类型
 * @returns 可选联赛赛事 Items
 * @see views/operationalManage/customLeague/components/custom-league-upsert-modal.vue
 */
export function fetchCustomLeagueLeagueListApi(query: {
  GameType?: number | string;
  SportId?: number | string;
}) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gamecustomleague/leaguelist',
      { params: query },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 获取联赛活动详情。
 *
 * @param id 联赛活动 ID
 * @returns 联赛活动详情对象
 * @see views/operationalManage/customLeague/components/custom-league-upsert-modal.vue
 */
export function fetchCustomLeagueDetailApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/gamecustomleague/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 新增联赛活动。
 *
 * @param data 联赛活动表单数据
 * @returns 接口响应
 * @see views/operationalManage/customLeague/components/custom-league-upsert-modal.vue
 */
export function createCustomLeagueApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamecustomleague/', data);
}

/**
 * 编辑联赛活动。
 *
 * @param data 联赛活动表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/customLeague/components/custom-league-upsert-modal.vue
 */
export function updateCustomLeagueApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecustomleague/', data);
}

/**
 * 删除联赛活动。
 *
 * @param id 联赛活动 ID
 * @returns 接口响应
 * @see views/operationalManage/customLeague/index.vue
 */
export function deleteCustomLeagueApi(id: number | string) {
  return requestClient.delete(`/backend/gamecustomleague/${id}`);
}

/**
 * 联赛活动排序（相邻两条互换 Sort）。
 *
 * @param data Id1、Id2 待互换的两条记录 ID
 * @returns 接口响应
 * @see views/operationalManage/customLeague/index.vue
 */
export function sortCustomLeagueApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/gamecustomleague/switchsort', data);
}

/**
 * 切换联赛活动启用/停用状态。
 *
 * @param data 含 Id 及开关字段
 * @returns 接口响应
 * @see views/operationalManage/customLeague/index.vue
 */
export function switchCustomLeagueApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecustomleague/switchactive', data);
}
