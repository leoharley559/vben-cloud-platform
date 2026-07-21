import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

type RawListPayload = {
  Items?: Record<string, unknown>[] | null;
  MoreItems?: Record<string, unknown> | null;
  Pagination?: { MaxCount?: number } | null;
  Total?: Record<string, unknown> | number | null;
  [key: string]: unknown;
};

/** 将接口可能返回的 null / 非对象 payload 归一化为稳定列表结构 */
function normalizeListPayload(data: RawListPayload | null | undefined) {
  return toListResult(data ?? null);
}

/**
 * 玩家统计报表列表（玩家统计页明细/汇总表格）
 *
 * 接口可能返回 null 或非对象 payload，经 `normalizeListPayload` 归一化为稳定列表结构。
 *
 * @param query 筛选条件（渠道、时间、分页等；`list`/`total` 模式由页面组装）
 * @returns Items / Pagination / Total / MoreItems 等标准列表结构
 * @see views/dataClose/playerStatistics/index.vue
 */
export function fetchPlayerStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/operation/playerstatistics', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/**
 * 玩家统计报表安全 CSV 导出（PageId=46）
 *
 * 异步导出任务，返回任务 Id / Status / Remark，非直接下载文件。
 *
 * @param query 与列表页一致的筛选参数
 * @returns 导出任务 Id、Status、Remark
 * @see views/dataClose/playerStatistics/index.vue
 */
export function exportPlayerStatisticsCsvApi(query: Record<string, unknown>) {
  return requestClient.get<{
    Id?: number | null;
    Remark?: string | null;
    Status?: number | null;
  }>('/backend/operation/playerstatisticscsv', {
    params: trimSpace(query),
  });
}

/**
 * 玩家输赢报表列表（用户输赢页）
 *
 * @param query 筛选条件；页面区分汇总/明细时传不同参数（如 IsTotal）
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/userWinLoss/index.vue
 */
export function fetchUserWinLossListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/operation/userstatistics', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/**
 * 玩家分析列表（玩家分析页主体表格）
 *
 * @param query 筛选条件；页面用不同查询模式（如 buildQuery(1)/buildQuery(2)）区分列表类型
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/playerAnalyze/index.vue
 */
export function fetchPlayerAnalyzeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/playeranalysis/playerlist', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/**
 * 玩家分析状态操作（玩家分析页启用/禁用/备注）
 *
 * @param data PlayerId 玩家 ID；Status 目标状态；Remark 可选备注
 * @returns 接口原始响应
 * @see views/dataClose/playerAnalyze/index.vue
 */
export function updatePlayerAnalyzeStatusApi(data: {
  PlayerId: number | string;
  Remark?: string;
  Status: number;
}) {
  return requestClient.put('/backend/playerext/', data);
}
