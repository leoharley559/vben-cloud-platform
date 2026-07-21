import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

/**
 * 获取老板日报员工业务统计列表。
 * @param query 查询参数（TimeNumber 日期 Unix 时间戳等）
 * @returns Items 员工业务统计行，Pagination.MaxCount 为条目数
 * @see views/operationalData/bossReport/index.vue
 */
export async function fetchBossEmployeeStatsApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ data?: Record<string, unknown>[] }>(
    '/backend/boosfunction/businessstatistics',
    { params: trimSpace(query) },
  );
  const items = data.data || [];
  return {
    Items: items,
    Pagination: { MaxCount: items.length },
  } satisfies CloudListResult<Record<string, unknown>>;
}

/**
 * 获取老板日报图表数据。
 * @param query 查询参数（日期、统计维度等）
 * @returns 图表序列与汇总字段
 */
export function fetchBossChartDataApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/boosfunction/listchart',
    { params: trimSpace(query) },
  );
}

/**
 * 获取老板日报平台用户统计数据。
 * @param query 查询参数（日期、统计维度等）
 * @returns data 平台用户统计行数组
 */
export function fetchBossPlatformStatsApi(query: Record<string, unknown>) {
  return requestClient.get<{ data?: Record<string, unknown>[] }>(
    '/backend/boosfunction/userstatistics',
    { params: trimSpace(query) },
  );
}
