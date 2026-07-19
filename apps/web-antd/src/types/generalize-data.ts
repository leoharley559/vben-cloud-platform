import type { CloudListResult } from '#/types/operation-manage';

export type { CloudListResult };

export interface InvalidUserSummary {
  CountDeviceNum?: number;
  CountNum0?: number;
  CountNum1?: number;
  CountNum3?: number;
  CountRegNum?: number;
}

export function toPromotionListResult(
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
