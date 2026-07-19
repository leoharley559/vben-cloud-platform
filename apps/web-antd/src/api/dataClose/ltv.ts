import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export function fetchLtvListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/operation/realtimeltv',
      { params: trimSpace(query) },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: {
          MaxCount:
            (data as CloudListResult<Record<string, unknown>>).Pagination
              ?.MaxCount ?? items.length,
        },
      } satisfies CloudListResult<Record<string, unknown>>;
    });
}
