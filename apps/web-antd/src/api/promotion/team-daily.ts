import type { TeamDailyListQuery, TeamDailyResult } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export async function fetchTeamDailyListApi(query: TeamDailyListQuery) {
  const data = await requestClient.get<null | TeamDailyResult>('/backend/accountteamdaily/list', {
    params: trimSpace(query),
  });
  return {
    BannerItems: data?.BannerItems || {},
    HistoryItems: data?.HistoryItems || [],
    TodayItems: data?.TodayItems || {},
  };
}
