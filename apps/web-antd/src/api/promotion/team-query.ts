import type { CloudListResult } from '#/types/operation-manage';
import type { TeamQueryItem, TeamQueryListQuery } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export async function fetchTeamQueryListApi(query: TeamQueryListQuery) {
  const data = await requestClient.get<CloudListResult<TeamQueryItem> | null>(
    '/backend/accountteamsearch/list',
    { params: trimSpace(query) },
  );
  return {
    Items: data?.Items || [],
    Pagination: data?.Pagination,
  };
}
