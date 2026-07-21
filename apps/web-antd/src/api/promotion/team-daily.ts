import type { TeamDailyListQuery, TeamDailyResult } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取团队日报数据
 * @param query 日期与团队筛选条件
 * @returns 今日数据、历史记录及横幅汇总
 * @see views/generalizeManage/teamDaily/components/team-daily-panel.vue
 * @see views/mobile/data/index.vue
 */
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
