import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchPlayerStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/playerstatistics', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchUserWinLossListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/userstatistics', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchPlayerAnalyzeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/playeranalysis/playerlist', { params: trimSpace(query) })
    .then(toListResult);
}
