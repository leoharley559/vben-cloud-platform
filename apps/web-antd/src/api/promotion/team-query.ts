import type { CloudListResult } from '#/types/operation-manage';
import type { TeamQueryItem, TeamQueryListQuery } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取团队查询列表
 * @param query 分页与筛选条件
 * @returns 团队查询记录列表及分页信息
 * @see views/generalizeManage/teamQuery/index.vue
 * @see views/mobile/team/history/index.vue
 */
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
