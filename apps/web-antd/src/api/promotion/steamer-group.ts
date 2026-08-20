import type { CloudListResult } from '#/types/operation-manage';
import type {
  SteamerDirectGroupResult,
  SteamerGroupItem,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取主播团队分组列表
 * @returns 主播团队分组列表及分页信息
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export async function fetchSteamerGroupListApi() {
  const data =
    await requestClient.get<CloudListResult<SteamerGroupItem> | null>(
      '/backend/sportsteamerteam/list',
    );
  // 空环境偶发 Items=null，统一归一避免页面崩溃
  return {
    Items: Array.isArray(data?.Items) ? data.Items : [],
    Pagination: data?.Pagination,
  } satisfies CloudListResult<SteamerGroupItem>;
}

/**
 * 获取指定管理员下的直属团队
 * @param query 含 AdminId 的查询参数
 * @returns 直属团队分组数据
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export async function fetchSteamerDirectGroupApi(query: {
  AdminId?: number | string;
}) {
  const data = await requestClient.get<null | SteamerDirectGroupResult>(
    '/backend/sportsteamerteam/getadminteams',
    { params: trimSpace(query) },
  );
  return {
    CanQingLiu: Boolean(data?.CanQingLiu),
    Teams: Array.isArray(data?.Teams) ? data.Teams : [],
  } satisfies SteamerDirectGroupResult;
}
