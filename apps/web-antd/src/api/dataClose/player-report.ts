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

/** 玩家统计报表 GET /backend/operation/playerstatistics */
export function fetchPlayerStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/operation/playerstatistics', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/** 玩家统计报表安全 CSV 导出 PageId=46 */
export function exportPlayerStatisticsCsvApi(query: Record<string, unknown>) {
  return requestClient.get<{
    Id?: number | null;
    Remark?: string | null;
    Status?: number | null;
  }>('/backend/operation/playerstatisticscsv', {
    params: trimSpace(query),
  });
}

/** 玩家输赢 GET /backend/operation/userstatistics */
export function fetchUserWinLossListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/operation/userstatistics', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/** 玩家分析列表 GET /backend/playeranalysis/playerlist */
export function fetchPlayerAnalyzeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<RawListPayload>('/backend/playeranalysis/playerlist', {
      params: trimSpace(query),
    })
    .then(normalizeListPayload);
}

/** 玩家分析状态操作 PUT /backend/playerext/ */
export function updatePlayerAnalyzeStatusApi(data: {
  PlayerId: number | string;
  Remark?: string;
  Status: number;
}) {
  return requestClient.put('/backend/playerext/', data);
}
