import type {
  NetcashListQuery,
  NetcashListResult,
  PlatformCreditApplyPayload,
  PlatformCreditApplyRecord,
  PlatformCreditApplyRecordQuery,
  PlatformCreditInfo,
  PlatformCreditReviewPayload,
  PlatformNetCashLog,
  PlatformNetCashLogQuery,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(
  result?: NetcashListResult<T> | null,
): NetcashListResult<T> {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

/**
 * 平台级代理信用额度信息（「平台信用额度管理」页额度概览）。
 *
 * @param query 查询参数（AdminId 等）
 * @returns 平台信用额度详情 PlatformCreditInfo
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export function getPlatformAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<PlatformCreditInfo>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

/**
 * 平台信用额度调整申请记录列表。
 *
 * @param query 查询参数（状态、时间、分页等）
 * @returns 申请记录 Items 及 Pagination
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export async function getPlatformCreditLimitApplyRecordListApi(
  query: PlatformCreditApplyRecordQuery,
) {
  const result = await requestClient.get<
    NetcashListResult<PlatformCreditApplyRecord>
  >(
    '/backend/agentcreditlimitapplyrecord/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 平台净现金流水日志列表。
 *
 * @param query 查询参数（AdminId、类型、时间、分页等）
 * @returns 流水 Items 及 Pagination
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export async function getPlatformNetCashLogListApi(
  query: PlatformNetCashLogQuery,
) {
  const result = await requestClient.get<NetcashListResult<PlatformNetCashLog>>(
    '/backend/netcashlog/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 提交平台信用额度调整申请。
 *
 * @param data 平台申请表单 PlatformCreditApplyPayload
 * @returns 接口操作结果
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export function applyPlatformCreditApi(data: PlatformCreditApplyPayload) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/applyplatformcredit',
    data,
  );
}

/**
 * 审批通过平台信用额度调整申请。
 *
 * @param data 审批载荷 PlatformCreditReviewPayload
 * @returns 接口操作结果
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export function approvePlatformCreditAdjustmentApi(
  data: PlatformCreditReviewPayload,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/approve',
    data,
  );
}

/**
 * 拒绝平台信用额度调整申请。
 *
 * @param data 审批载荷 PlatformCreditReviewPayload
 * @returns 接口操作结果
 * @see views/netcash/creditLimitPlatformManage/index.vue
 */
export function rejectPlatformCreditAdjustmentApi(
  data: PlatformCreditReviewPayload,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/reject',
    data,
  );
}
