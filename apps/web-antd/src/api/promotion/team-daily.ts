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
  const data = await requestClient.get<null | TeamDailyResult>(
    '/backend/accountteamdaily/list',
    {
      params: trimSpace(query),
    },
  );
  // 空环境 HistoryItems 常为 null；Today/Banner 可能为全 0 对象
  return {
    BannerItems:
      data?.BannerItems && typeof data.BannerItems === 'object'
        ? data.BannerItems
        : {},
    HistoryItems: Array.isArray(data?.HistoryItems) ? data.HistoryItems : [],
    TodayItems:
      data?.TodayItems && typeof data.TodayItems === 'object'
        ? data.TodayItems
        : {},
  } satisfies TeamDailyResult;
}
