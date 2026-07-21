import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';

/**
 * 电销中心报表通用列表 GET。
 *
 * 请求后经 `toTelesalesListResult` 归一化 Items 与 Pagination。
 *
 * @param url 后端列表接口路径
 * @param query 查询参数（分页、日期等）
 * @returns 归一化后的 Items 及 Pagination.MaxCount
 */
function listApi(url: string, query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>(url, { params: query })
    .then(toTelesalesListResult);
}

/**
 * 通话记录报表列表（通话记录报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/callRecordReport/index.vue
 */
export const fetchCallRecordListApi = (query: Record<string, unknown>) =>
  listApi('/backend/callrecordreport/list', query);

/**
 * 通话统计报表列表（通话统计报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/callStatisticsReport/index.vue
 */
export const fetchCallStatisticsListApi = (query: Record<string, unknown>) =>
  listApi('/backend/callstatisticsreport/list', query);

/**
 * VIP 玩家报表列表（VIP 玩家报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/vipPlayerReport/index.vue
 */
export const fetchVipPlayerReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/vipplayerreport/list', query);

/**
 * 新注册充值报表列表（新注册充值报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/newRegisterDepositReport/index.vue
 */
export const fetchNewRegisterDepositListApi = (
  query: Record<string, unknown>,
) => listApi('/backend/newregisterdepositreport/list', query);

/**
 * 新注册未充值报表列表（新注册未充值报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/newRegisterNoDepositReport/index.vue
 */
export const fetchNewRegisterNoDepositListApi = (
  query: Record<string, unknown>,
) => listApi('/backend/newregisternodepositreport/list', query);

/**
 * 群组维护报表列表（群组维护报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/groupMaintenanceReport/index.vue
 */
export const fetchGroupMaintenanceListApi = (query: Record<string, unknown>) =>
  listApi('/backend/groupmaintenancereport/list', query);

/**
 * 休眠玩家报表列表（休眠报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/dormantReport/index.vue
 */
export const fetchDormantReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/dormantreport/list', query);

/**
 * 冻结资金报表列表（冻结资金报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/blockedMoneyReport/index.vue
 */
export const fetchBlockedMoneyListApi = (query: Record<string, unknown>) =>
  listApi('/backend/blockedmoneyreport/list', query);

/**
 * 活跃用户报表列表（活跃用户报表页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/activeUserReport/index.vue
 */
export const fetchActiveUserReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/activeuserreport/list', query);
