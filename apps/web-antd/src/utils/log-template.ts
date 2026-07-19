import type { LogListItem } from '#/types/system-manage';

function interpolateTemplate(
  template: string,
  params: Record<string, unknown>,
) {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(
      new RegExp(`\\{${key}\\}`, 'g'),
      value === undefined || value === null ? '' : String(value),
    );
  }
  return result;
}

export function parseLogParams(params?: LogListItem['Params']) {
  if (!params) {
    return {} as Record<string, unknown>;
  }
  if (typeof params === 'object') {
    return params;
  }
  try {
    return JSON.parse(params) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

/** 渲染操作日志内容（精简版，后续可按 TemplateId 扩展映射） */
export function formatLogContent(row: LogListItem) {
  const template = row.LogTemplate || '';
  if (!template) {
    return row.LogType || '-';
  }

  try {
    const params = parseLogParams(row.Params);
    return interpolateTemplate(template, params) || template;
  } catch {
    return template;
  }
}
