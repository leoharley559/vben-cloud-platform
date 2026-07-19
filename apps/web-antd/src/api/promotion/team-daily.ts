import { requestClient } from '#/api/request';
import type { TeamDailyListQuery, TeamDailyResult } from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchTeamDailyListApi(query: TeamDailyListQuery) {
  return requestClient.get<TeamDailyResult>('/backend/accountteamdaily/list', {
    params: trimSpace(query),
  });
}
