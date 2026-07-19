import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

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

export function fetchMobileGameDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/mobilegamedetail', { params: trimSpace(query) })
    .then(toMobileListResult);
}

export function fetchMobilePackageListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/package/list', { params: query })
    .then(toMobileListResult);
}

export function fetchMobileChannelListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/channel/list', { params: trimSpace(query) })
    .then(toMobileListResult);
}

export function fetchTeamDailyByAdminApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      TodayItemsByEveryAdmin?: Record<string, unknown>[];
    }>('/backend/accountteamdaily/list', { params: trimSpace(query) })
    .then((data) => toMobileListResult({}, data.TodayItemsByEveryAdmin || []));
}
