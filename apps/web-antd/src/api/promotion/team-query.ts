import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { TeamQueryItem, TeamQueryListQuery } from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchTeamQueryListApi(query: TeamQueryListQuery) {
  return requestClient.get<CloudListResult<TeamQueryItem>>(
    '/backend/accountteamsearch/list',
    { params: trimSpace(query) },
  );
}
