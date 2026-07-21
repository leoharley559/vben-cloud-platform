import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerAdjustListItem,
  PlayerAdjustListQuery,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

/**
 * 查询玩家账户调整审批/记录列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns 调整记录列表 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/accountAdjust/components/adjust-audit-list.vue
 * @see views/operationalManage/accountAdjust/components/adjust-record-list.vue
 * @see views/operationalManage/playerDetails/components/player-adjust-list.vue
 */
export function fetchPlayerAdjustListApi(query: PlayerAdjustListQuery) {
  return requestClient.get<
    CloudListResult<PlayerAdjustListItem> & {
      Total?: { Total?: number | string };
    }
  >('/backend/playergoldaccountchange/approvelist', {
    params: trimSpace(query),
  });
}

/**
 * 提交单笔玩家账户调整申请
 * @param data 调整表单（玩家、金额、类型、备注等）
 * @returns 接口操作结果
 * @see views/operationalManage/accountAdjust/components/adjust-form.vue
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function createAccountAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/', data);
}

/**
 * 批量提交玩家账户调整申请
 * @param data 批量调整数据（含多条调整明细）
 * @returns 接口操作结果
 * @see views/operationalManage/accountAdjust/components/adjust-form.vue
 */
export function batchCreateAccountAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/batch', data);
}

/**
 * 审批玩家账户调整（通过/拒绝）
 * @param data 审批参数（记录 Id、审批结果及备注）
 * @returns 接口操作结果
 * @see views/operationalManage/accountAdjust/components/adjust-audit-action-modal.vue
 */
export function disposeAccountAdjustAuditApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/approve', data);
}
