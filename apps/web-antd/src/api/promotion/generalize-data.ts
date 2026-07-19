import { requestClient } from '#/api/request';
import { toPromotionListResult } from '#/types/generalize-data';
import type { InvalidUserSummary } from '#/types/generalize-data';
import { trimSpace } from '#/utils/string';

export async function fetchChannelDatasListApi(query: Record<string, unknown>) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/promotedata/channelreport', { params: trimSpace(query) });
  return toPromotionListResult(data);
}

export async function fetchChannelRecoupCostsListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/operation/channelbreakevenreport', { params: trimSpace(query) });
  return toPromotionListResult(data);
}

export function fetchDataWriteListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/handrecord/list', { params: trimSpace(query) })
    .then(toPromotionListResult);
}

export async function fetchDropChangeListApi(query: Record<string, unknown>) {
  const data = await requestClient.get<{
    Item?: Record<string, unknown>[];
    Page?: { MaxCount?: number };
  }>('/backend/promotedata/getsumrecord', { params: trimSpace(query) });
  const items = data.Item || [];
  return toPromotionListResult(
    { Pagination: { MaxCount: data.Page?.MaxCount } },
    items,
  );
}

export function fetchInvalidUserSummaryApi(query: Record<string, unknown>) {
  return requestClient.get<{ Items?: InvalidUserSummary }>(
    '/backend/promotedata/invaliduser',
    { params: trimSpace(query) },
  );
}
