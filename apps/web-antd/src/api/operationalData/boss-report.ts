import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export async function fetchBossEmployeeStatsApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ data?: Record<string, unknown>[] }>(
    '/backend/boosfunction/businessstatistics',
    { params: trimSpace(query) },
  );
  const items = data.data || [];
  return {
    Items: items,
    Pagination: { MaxCount: items.length },
  } satisfies CloudListResult<Record<string, unknown>>;
}

export function fetchBossChartDataApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/boosfunction/listchart',
    { params: trimSpace(query) },
  );
}

export function fetchBossPlatformStatsApi(query: Record<string, unknown>) {
  return requestClient.get<{ data?: Record<string, unknown>[] }>(
    '/backend/boosfunction/userstatistics',
    { params: trimSpace(query) },
  );
}
