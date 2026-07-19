import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchGameStatementListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      ItemsMoney?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gamestatisticsbygametype', {
      params: trimSpace(query),
    })
    .then((data) => toListResult(data, data.ItemsMoney || data.Items));
}

export function fetchClassifiedReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gamestatisticsbygameplatformtype', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function fetchSubGameReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gamestatisticsbysubgame', {
      params: trimSpace(query),
    })
    .then(toListResult);
}
