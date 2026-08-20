import type { CloudListResult } from '#/types/operation-manage';

export const PROMO_CODE_TYPE = 10_017;

export function normalizeCloudList<T>(data: unknown): CloudListResult<T> {
  if (Array.isArray(data)) {
    return { Items: data as T[] };
  }
  if (data && typeof data === 'object') {
    const record = data as CloudListResult<T>;
    if (Array.isArray(record.Items)) {
      return record;
    }
  }
  return { Items: [] };
}

export function parseJsonArray<T>(value: unknown): T[] {
  if (!value || value === 'null') {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
