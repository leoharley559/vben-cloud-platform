import type { CloudListResult } from '#/types/operation-manage';

export type { CloudListResult };

export interface DataCloseQuery extends Record<string, unknown> {
  BeginTime?: number | string;
  EndTime?: number | string;
  Page?: number;
  PageSize?: number;
}

export function toListResult(
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
