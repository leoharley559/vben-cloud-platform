import { requestClient } from '#/api/request';
import { toSportsListResult } from '#/types/sports-manager';

/**
 * 体育赛事直播列表（赛事管理页）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount（经 toSportsListResult 归一化）
 * @see views/sportsManager/matchManager/index.vue
 */
export function fetchSportsMatchListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      respond?: {
        Items?: Record<string, unknown>[];
        MaxCount?: number;
      };
    }>('/backend/sportslivematch/list', { params: query })
    .then(toSportsListResult);
}
