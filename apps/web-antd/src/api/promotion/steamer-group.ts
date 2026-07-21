import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  SteamerDirectGroupResult,
  SteamerGroupItem,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

/**
 * 获取主播团队分组列表
 * @returns 主播团队分组列表及分页信息
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function fetchSteamerGroupListApi() {
  return requestClient.get<CloudListResult<SteamerGroupItem>>(
    '/backend/sportsteamerteam/list',
  );
}

/**
 * 获取指定管理员下的直属团队
 * @param query 含 AdminId 的查询参数
 * @returns 直属团队分组数据
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function fetchSteamerDirectGroupApi(query: {
  AdminId?: number | string;
}) {
  return requestClient.get<SteamerDirectGroupResult>(
    '/backend/sportsteamerteam/getadminteams',
    { params: trimSpace(query) },
  );
}
