import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export function fetchGameAnalysisReportApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gametransactionanalysisreport', {
      params: trimSpace(query),
    })
    .then((data) => ({
      Items: data.Items || [],
      Pagination: {
        MaxCount: data.Pagination?.MaxCount ?? (data.Items || []).length,
      },
    })) as Promise<CloudListResult<Record<string, unknown>>>;
}
