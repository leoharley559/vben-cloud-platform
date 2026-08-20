import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

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
): null | T {
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
 * 分页查询排行榜活动列表。
 *
 * @param query 筛选条件及分页参数
 * @returns 排行榜活动 Items 与 Pagination
 * @see views/operationalManage/leaderboard/components/leaderboard-active-panel.vue
 */
export function fetchLeaderboardListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/leaderboard/list',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 按 ID 获取排行榜活动详情。
 *
 * @param id 排行榜活动 ID
 * @returns 排行榜活动详情对象
 * @see views/operationalManage/leaderboard/components/leaderboard-upsert-modal.vue
 */
export function fetchLeaderboardByIdApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/leaderboard/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 新增排行榜活动。
 *
 * @param data 排行榜活动表单数据
 * @returns 接口响应
 * @see views/operationalManage/leaderboard/components/leaderboard-upsert-modal.vue
 */
export function createLeaderboardApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/leaderboard', data);
}

/**
 * 编辑排行榜活动。
 *
 * @param data 排行榜活动表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/leaderboard/components/leaderboard-upsert-modal.vue
 */
export function updateLeaderboardApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/leaderboard', data);
}

/**
 * 下架排行榜活动。
 *
 * @param id 排行榜活动 ID
 * @returns 接口响应
 * @see views/operationalManage/leaderboard/components/leaderboard-active-panel.vue
 */
export function offshelfLeaderboardApi(id: number | string) {
  return requestClient.put(`/backend/leaderboard/offshelve/${id}`);
}

/**
 * 获取排行榜全局主配置。
 *
 * @returns 排行榜全局配置对象
 * @see views/operationalManage/leaderboard/components/leaderboard-global-config-modal.vue
 */
export function fetchLeaderboardMainConfigApi() {
  return requestClient
    .get<Record<string, unknown>>(
      '/backend/leaderboard/getleaderboardmainconfig',
    )
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 更新排行榜全局主配置。
 *
 * @param data 全局配置字段
 * @returns 接口响应
 * @see views/operationalManage/leaderboard/components/leaderboard-global-config-modal.vue
 */
export function updateLeaderboardMainConfigApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/leaderboard/updateleaderboardmainconfig',
    data,
  );
}

/**
 * 切换排行榜全局主配置开关。
 *
 * @returns 接口响应
 * @see views/operationalManage/leaderboard/components/leaderboard-global-config-modal.vue
 */
export function switchLeaderboardMainConfigApi() {
  return requestClient.put('/backend/leaderboard/switchmainconfig');
}

/**
 * 分页查询排行榜上榜记录。
 *
 * @param query 活动 ID、时间等筛选及分页参数
 * @returns 上榜记录 Items 与 Pagination
 * @see views/operationalManage/leaderboard/components/leaderboard-record-panel.vue
 * @see views/operationalManage/leaderboard/components/leaderboard-rankings-modal.vue
 */
export function fetchLeaderboardRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/leaderboard/record',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 导出排行榜上榜记录 CSV。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/leaderboard/components/leaderboard-record-panel.vue
 */
export function exportLeaderboardRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/leaderboard/recordexport',
    { params: trimSpace(params) },
  );
}
