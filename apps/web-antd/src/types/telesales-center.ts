import type { CloudListResult } from '#/types/operation-manage';

export type { CloudListResult };

export function toTelesalesListResult(
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

export const TASK_STATUS_MAP: Record<number, string> = {
  0: '未开始',
  1: '进行中',
  2: '已完成',
};
