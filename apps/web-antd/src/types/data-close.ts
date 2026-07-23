import type { CloudListResult } from '#/types/operation-manage';

export type { CloudListResult };

export type ReportRow = Record<string, unknown>;

export interface DataCloseQuery extends Record<string, unknown> {
  BeginTime?: number | string;
  EndTime?: number | string;
  Page?: number;
  PageSize?: number;
}

export interface ReportListResult<T extends ReportRow = ReportRow>
  extends CloudListResult<T> {
  ItemsMoney?: T[];
  ItemsOld?: T[];
  MoreItems?: ReportRow;
  Total?: ReportRow | number;
  [key: string]: unknown;
}

export function toListResult(
  data?: {
    Items?: ReportRow[] | null;
    ItemsMoney?: ReportRow[] | null;
    ItemsOld?: ReportRow[] | null;
    MoreItems?: ReportRow | null;
    Pagination?: { MaxCount?: number } | null;
    Total?: ReportRow | number | null;
    [key: string]: unknown;
  } | null,
  items?: ReportRow[],
): ReportListResult {
  if (!data || typeof data !== 'object') {
    return {
      Items: items ?? [],
      MoreItems: {},
      Pagination: { MaxCount: items?.length ?? 0 },
      Total: {},
    };
  }

  const resolvedItems =
    items ??
    (Array.isArray(data.ItemsMoney) && data.ItemsMoney.length > 0
      ? data.ItemsMoney
      : Array.isArray(data.ItemsOld) && data.ItemsOld.length > 0
        ? data.ItemsOld
        : Array.isArray(data.Items)
          ? data.Items
          : []);

  return {
    ...data,
    Items: resolvedItems,
    ItemsMoney: Array.isArray(data.ItemsMoney) ? data.ItemsMoney : [],
    ItemsOld: Array.isArray(data.ItemsOld) ? data.ItemsOld : [],
    MoreItems:
      data.MoreItems && typeof data.MoreItems === 'object'
        ? data.MoreItems
        : {},
    Pagination: {
      MaxCount:
        data.Pagination?.MaxCount ??
        (typeof data.Total === 'number' ? data.Total : resolvedItems.length),
    },
    Total:
      data.Total && typeof data.Total === 'object'
        ? data.Total
        : typeof data.Total === 'number'
          ? { MaxCount: data.Total }
          : {},
  };
}

/**
 * 区间留存等接口：`Items` 可能是「单对象矩阵」而非数组。
 * 对齐旧站 `tableData.push(data.Items)`：把矩阵对象包成一行。
 */
export function wrapMatrixAsList(payload: ReportRow | null | undefined) {
  if (!payload || typeof payload !== 'object') {
    return toListResult({ Items: [] });
  }
  if (Array.isArray(payload.Items)) {
    return toListResult(payload);
  }
  // respond.Items 为对象矩阵（everydaylogindau）
  if (payload.Items && typeof payload.Items === 'object') {
    return toListResult({
      ...payload,
      Items: [payload.Items as ReportRow],
      Pagination: payload.Pagination ?? { MaxCount: 1 },
    });
  }
  // Items 缺失/null：若根对象本身像矩阵（含 CountLogin*），仍包一行
  if (payload.Items == null && 'CountLogin1' in payload) {
    return toListResult({
      Items: [payload],
      Pagination: { MaxCount: 1 },
    });
  }
  return toListResult({
    ...payload,
    Items: [],
    Pagination: payload.Pagination ?? { MaxCount: 0 },
  });
}
