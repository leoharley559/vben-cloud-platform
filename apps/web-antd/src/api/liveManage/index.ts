import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';
import { registerPermissionKeys } from '#/utils/permission';

registerPermissionKeys({
  betRuleConfig: [13051],
  landingPageList: [11602],
  liveChatroomTab: [11533],
  liveEventCurrent: [13026],
  pkManage: [13070],
  pushManage: [11589],
  scheduleList: [11532],
  streamerHostManage: [11535],
});

/**
 * 将云后台列表响应归一化为 Items + Pagination 结构
 * @param data 云后台原始列表响应
 * @returns 含 Items 数组与 Pagination.MaxCount 的标准列表结果
 */
function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

/**
 * 直播间列表
 *
 * @param query 筛选/分页参数（会 trim 空格）
 * @returns 归一化后的直播间列表（Items + Pagination）
 * @see views/liveManage/liveRoomManage
 */
export function fetchLiveRoomListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportsteaming/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 主播列表
 *
 * @param query 筛选/分页参数（会 trim 空格）
 * @returns 归一化后的主播列表（Items + Pagination）
 * @see views/liveManage/streamerManage
 */
export function fetchStreamerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportsteamer/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 赛程列表
 *
 * @param query 筛选/分页参数（含日期等）
 * @returns 归一化后的赛程列表（Items + Pagination）
 * @see views/liveManage/matchSchedule
 */
export function fetchMatchScheduleListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/sportmatch/list', {
      params: query,
    })
    .then(toListResult);
}

/**
 * 推单记录列表
 *
 * @param query 筛选/分页参数（会 trim 空格，含日期等）
 * @returns 归一化后的推单列表（Items + Pagination）
 * @see views/liveManage/pushOrder
 */
export function fetchPushOrderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gamepushorder/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 落地页列表
 *
 * @param query 筛选/分页参数（会 trim 空格）
 * @returns 归一化后的落地页列表（Items + Pagination）
 * @see views/liveManage/landingPage
 */
export function fetchLandingPageListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/landingpagefordisplay/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 直播活动配置列表
 *
 * @param query 筛选/分页参数（会 trim 空格，含日期等）
 * @returns 归一化后的直播活动列表（Items + Pagination）
 * @see views/liveManage/liveEvent
 */
export function fetchLiveEventListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/livestreamactivitiesconfig/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * PK 主题列表
 *
 * @param query 筛选/分页参数（含日期等）
 * @returns 归一化后的 PK 主题列表（Items + Pagination）
 * @see views/liveManage/pkManagement
 */
export function fetchPkListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportpktheme/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 竞猜主题列表
 *
 * @param query 筛选/分页参数（含日期等）
 * @returns 归一化后的竞猜主题列表（Items + Pagination）
 * @see views/liveManage/guessingManage
 */
export function fetchGuessThemeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportbettheme/list',
      { params: query },
    )
    .then(toListResult);
}
