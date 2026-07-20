import dayjs from 'dayjs';

export type CommissionRow = Record<string, any>;

export interface NormalizedList {
  items: CommissionRow[];
  total: CommissionRow;
  totalCount: number;
}

export function normalizeList(value: unknown): NormalizedList {
  const source = (value ?? {}) as CommissionRow;
  const body = (source.respond ?? source.Data ?? source.data ?? source) as
    | CommissionRow
    | CommissionRow[];
  if (Array.isArray(body)) {
    return { items: body, total: {}, totalCount: body.length };
  }
  const items = Array.isArray(body?.Items)
    ? body.Items
    : (Array.isArray(body?.items)
      ? body.items
      : []);
  const pagination = body?.Pagination ?? body?.pagination ?? {};
  return {
    items,
    total: (body?.Total ?? body?.total ?? {}) as CommissionRow,
    totalCount: Number(
      pagination.MaxCount ??
        pagination.Total ??
        body?.TotalCount ??
        body?.totalCount ??
        items.length,
    ),
  };
}

export function normalizeRows(value: unknown): CommissionRow[] {
  const normalized = normalizeList(value);
  if (normalized.items.length > 0) return normalized.items;
  const source = (value ?? {}) as CommissionRow;
  const body = source.respond ?? source.Data ?? source.data ?? source;
  return Array.isArray(body) ? body : [];
}

export function cent(value: unknown): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? (amount / 100).toFixed(2) : '0.00';
}

export function percent100(value: unknown): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `${amount / 100}%` : '0%';
}

export function dateTime(value: unknown): string {
  if (!value) return '-';
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && numeric > 0
      ? dayjs(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
      : dayjs(String(value));
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

export function currentMonth(offset = 0): string {
  return dayjs().subtract(offset, 'month').format('YYYY-MM');
}

export function settlementLabel(value: unknown): string {
  return ({ 1: '日结', 2: '周结', 3: '月结' } as Record<number, string>)[
    Number(value)
  ] ?? '-';
}

export function settlementDate(row: CommissionRow): string {
  if (Number(row.SettlementType) === 1) return String(row.ReportDay ?? '-');
  if (Number(row.SettlementType) === 2) {
    return `${row.ReportDay ?? '-'} - ${row.ReportDayEnd ?? '-'}`;
  }
  return String(row.ReportMonth ?? '-');
}

export function safeRateRows(value: unknown): CommissionRow[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const rows = JSON.parse(String(value));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function hasPermission(
  check: (permission: number) => boolean,
  permission: number,
): boolean {
  return check(permission);
}
