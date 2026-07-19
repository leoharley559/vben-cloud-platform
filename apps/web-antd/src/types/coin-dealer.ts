import type { CloudListResult } from '#/types/operation-manage';

export function toCoinDealerListResult<T extends Record<string, unknown>>(
  data: CloudListResult<T> & { Total?: Record<string, unknown> },
) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
    Total: data.Total,
  } satisfies CloudListResult<T> & { Total?: Record<string, unknown> };
}
