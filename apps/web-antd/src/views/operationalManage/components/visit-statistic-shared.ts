import type { CloudProjectConfig } from '#/types/cloud-platform';

export interface ProjectConfigOption {
  Name: string;
  Value: number | string;
}

/** 从 ProjectConfig 数组按 Key 解析 JSON 下拉 */
export function parseProjectConfigOptions(
  projectConfig: CloudProjectConfig | null | undefined,
  key: string,
): ProjectConfigOption[] {
  const list = (projectConfig as Record<string, unknown> | null | undefined)
    ?.ProjectConfig;
  if (!Array.isArray(list)) {
    return [];
  }
  const hit = list.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item as { Key?: string }).Key === key,
  ) as { ValueString?: string } | undefined;
  if (!hit?.ValueString) {
    return [];
  }
  try {
    const parsed = JSON.parse(hit.ValueString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatVisitSource(raw: unknown) {
  if (raw === undefined || raw === null || raw === '') {
    return '-';
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { source?: string };
      return parsed?.source || raw;
    } catch {
      return raw;
    }
  }
  return String(raw);
}

export function formatVisitDurationSeconds(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '-';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substring(11, 19);
}

export function keepTwoDecimal(value: number) {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function percentOf(part: number, total: number) {
  if (!total) {
    return '0.00';
  }
  return keepTwoDecimal((part * 100) / total);
}

export function resolveAppTypeLabel(
  appType: unknown,
  deviceOptions: ProjectConfigOption[],
) {
  const key = String(appType ?? '');
  const hit = deviceOptions.find((item) => String(item.Value) === key);
  return hit?.Name || key || '-';
}
