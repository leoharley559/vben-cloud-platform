import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export async function fetchOperationDailyWinRankApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    TodayPlayerItemsWin?: Record<string, unknown>[];
  }>('/backend/operationdayreport/dayreportwinrank', {
    params: trimSpace(query),
  });
  const items = data.TodayPlayerItemsWin || [];
  return toListResult({}, items);
}

export function fetchOperationDailyReportApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dayreport',
    { params: trimSpace(query) },
  );
}

export function fetchOperationIncomeAnalyzeApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/incomeanalyze',
    { params: trimSpace(query) },
  );
}

export function fetchOperationPromotionAnalyzeApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/promotionanalyze',
    { params: trimSpace(query) },
  );
}
