import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 投注行为报表（不分页，直接返回 Items） */
export function fetchGameAnalysisReportApi(query: Record<string, unknown>) {
  return requestClient.get<{
    Items?: Record<string, unknown>[];
  }>('/backend/operation/gametransactionanalysisreport', {
    params: trimSpace(query),
  });
}
