import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';

/**
 * 查询活动访问明细列表
 * @param query 筛选条件（活动、时间范围及分页）
 * @returns 访问明细列表 Items 及 Pagination
 * @see views/operationalManage/activityStatistics/index.vue
 * @see views/operationalManage/activity-all-stats/index.vue
 */
export function fetchActivityVisitListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/list',
    { params: query },
  );
}

/**
 * 查询活动功能使用明细记录
 * @param query 筛选条件（活动、功能类型及分页）
 * @returns 功能使用明细列表 Items 及 Pagination
 */
export function fetchActivityUtilityRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getutilityrecord',
    { params: query },
  );
}

/**
 * 查询活动功能使用统计汇总
 * @param query 筛选条件（活动、时间范围）
 * @returns 功能使用统计数据列表 Items 及 Pagination
 */
export function fetchActivityUtilityStatisticsApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getutilitystatistics',
    { params: query },
  );
}

/**
 * 查询活动访问统计汇总
 * @param query 筛选条件（活动、时间范围）
 * @returns 访问统计数据列表 Items 及 Pagination
 * @see views/operationalManage/activityStatistics/index.vue
 * @see views/operationalManage/activity-all-stats/index.vue
 */
export function fetchActivityVisitStatisticsApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/statistics',
    { params: query },
  );
}

/**
 * 查询活动综合统计摘要
 * @param query 筛选条件（活动、时间范围）
 * @returns 活动摘要统计数据列表 Items 及 Pagination
 * @see views/operationalManage/activityStatistics/index.vue
 */
export function fetchActivitySummaryApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getactivitysummary',
    { params: query },
  );
}

/**
 * 查询活动首充统计摘要
 * @param query 筛选条件（活动、时间范围）
 * @returns 首充摘要统计数据列表 Items 及 Pagination
 * @see views/operationalManage/activityStatistics/index.vue
 * @see views/operationalManage/activity-all-stats/index.vue
 */
export function fetchActivityFirstPaySummaryApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getfirstpaysummary',
    { params: query },
  );
}

/**
 * 查询活动抽奖信息统计列表
 * @param query 筛选条件（活动、时间范围）
 * @returns 抽奖信息统计列表 Items 及 Pagination
 * @see views/operationalManage/activityStatistics/index.vue
 * @see views/operationalManage/activity-all-stats/index.vue
 */
export function fetchLuckyDrawInfoListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getluckydrawinfolist',
    { params: query },
  );
}
