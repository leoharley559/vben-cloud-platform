import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 直播数据统计列表（直播报表「直播数据」Tab）
 *
 * @param query 日期区间、直播间等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchLiveDataStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/livereport/listlivestatistics', { params: query })
    .then(toListResult);
}

/**
 * 直播间统计列表（直播报表「直播间统计」Tab）
 *
 * @param query 日期区间、直播间等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchLiveRoomStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/livereport/liststeamingstatistics', { params: query })
    .then(toListResult);
}

/**
 * 主播打赏统计列表（直播报表「主播打赏」Tab）
 *
 * @param query 日期区间、主播等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchAnnouncerDonateListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/chatroomgiftrecordstatistic/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

/**
 * 礼物报表列表（直播报表「礼物报表」Tab）
 *
 * @param query 日期区间、礼物类型等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchGiftReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/chatroomgiftsummary/list', { params: trimSpace(query) })
    .then(toListResult);
}

/**
 * 竞猜游戏报表列表（直播报表「竞猜游戏」Tab）
 *
 * @param query 日期区间、赛事等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchGuessingGameReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/sportbettransaction/steammatchreport', { params: query })
    .then(toListResult);
}

/**
 * 直播游戏报表列表（直播报表「直播游戏」Tab）
 *
 * @param query 日期区间、游戏等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchLiveGameReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/gamezbdp/livereport', { params: query })
    .then(toListResult);
}

/**
 * PK 统计列表（直播报表「PK 统计」Tab）
 *
 * @param query 日期区间、PK 场次等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/liveStatement/index.vue
 */
export function fetchPkStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/sportpkstatistic/list', { params: query })
    .then(toListResult);
}
