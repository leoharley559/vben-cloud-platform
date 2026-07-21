import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将移动端列表接口响应规范为 CloudListResult 结构。
 *
 * @param data 原始响应（含 Items / Pagination）
 * @param items 可选，显式指定列表项（如从嵌套字段 TodayItemsByEveryAdmin 提取）
 * @returns 含 Items 与 Pagination.MaxCount 的标准列表结果
 */
export function toMobileListResult(
  data: {
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  },
  items?: Record<string, unknown>[],
) {
  const resolvedItems = items ?? data.Items ?? [];
  return {
    Items: resolvedItems,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? resolvedItems.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

/**
 * 移动端游戏明细列表（玩家查询「游戏明细」页表格数据）。
 *
 * @param query 查询参数（玩家账号、时间范围、分页等）
 * @returns 游戏明细行列表及分页信息
 * @see views/mobile/query/gameDetail/index.vue
 */
export function fetchMobileGameDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/mobilegamedetail', { params: trimSpace(query) })
    .then(toMobileListResult);
}

/**
 * 移动端包体列表（推广/开户等页选择包名时的下拉数据源）。
 *
 * @param query 查询参数（可选筛选条件）
 * @returns 包体列表及分页信息
 */
export function fetchMobilePackageListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/package/list', { params: query })
    .then(toMobileListResult);
}

/**
 * 移动端渠道列表（推广页展示可推广渠道及二维码入口）。
 *
 * @param query 查询参数（可选渠道筛选）
 * @returns 渠道列表及分页信息
 * @see views/mobile/promotion/index.vue
 */
export function fetchMobileChannelListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/channel/list', { params: trimSpace(query) })
    .then(toMobileListResult);
}

/**
 * 团队今日数据按管理员汇总（移动端团队「今日数据」页）。
 *
 * @param query 查询参数（团队/日期筛选）
 * @returns 各管理员今日数据行列表
 * @see views/mobile/team/daily/index.vue
 */
export function fetchTeamDailyByAdminApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      TodayItemsByEveryAdmin?: Record<string, unknown>[];
    }>('/backend/accountteamdaily/list', { params: trimSpace(query) })
    .then((data) => toMobileListResult({}, data.TodayItemsByEveryAdmin || []));
}
