import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { ActivityMatchBonusItem } from '#/types/activity-match-bonus';
import { trimSpace } from '#/utils/string';

/**
 * 查询活动赛事奖金申请记录列表
 * @param query 筛选条件（活动、玩家、状态及分页）
 * @returns 赛事奖金申请记录列表 Items 及 Pagination
 * @see views/operationalManage/audit/components/match-record-list.vue
 */
export function fetchActivityMatchBonusListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<ActivityMatchBonusItem>>(
    '/backend/activitymatchbonusapplyrecord/list',
    { params: trimSpace(query) },
  );
}

/**
 * 批量通过活动赛事奖金审核
 * @param data 审核参数（记录 Ids 及审批备注）
 * @returns 接口操作结果
 * @see views/operationalManage/audit/components/match-record-list.vue
 */
export function approveActivityMatchBonusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/batchapproveaudit',
    data,
  );
}

/**
 * 批量拒绝活动赛事奖金审核
 * @param data 审核参数（记录 Ids 及拒绝原因）
 * @returns 接口操作结果
 * @see views/operationalManage/audit/components/match-record-list.vue
 */
export function rejectActivityMatchBonusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/batchrejectaudit',
    data,
  );
}

/**
 * 更新活动赛事奖金申请备注
 * @param data 备注参数（记录 Id 及 Remark）
 * @returns 接口操作结果
 * @see views/operationalManage/audit/components/match-record-list.vue
 */
export function updateActivityMatchBonusRemarkApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/updateremark',
    data,
  );
}
