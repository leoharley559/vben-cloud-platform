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

export function getPlatformAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<PlatformCreditInfo>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

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

export function applyPlatformCreditApi(data: PlatformCreditApplyPayload) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/applyplatformcredit',
    data,
  );
}

export function approvePlatformCreditAdjustmentApi(
  data: PlatformCreditReviewPayload,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/approve',
    data,
  );
}

export function rejectPlatformCreditAdjustmentApi(
  data: PlatformCreditReviewPayload,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/reject',
    data,
  );
}
