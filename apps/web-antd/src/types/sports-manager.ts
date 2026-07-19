import type { CloudListResult } from '#/types/operation-manage';

export function toSportsListResult(data: {
  respond?: {
    Items?: Record<string, unknown>[];
    MaxCount?: number;
  };
}) {
  const items = data.respond?.Items ?? [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.respond?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

export const SPORTS_SOURCE_MAP: Record<number, string> = {
  2: 'im',
  7: '沙巴',
};

export function formatSportsSource(value: unknown) {
  const key = Number(value);
  return SPORTS_SOURCE_MAP[key] || '极速';
}
