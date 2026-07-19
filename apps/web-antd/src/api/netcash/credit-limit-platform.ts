import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function getPlatformAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

export function getPlatformCreditLimitApplyRecordListApi(
  query: NetcashListQuery,
) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    { params: trimSpace(query) },
  );
}

export function getPlatformNetCashLogListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/netcashlog/list', {
    params: trimSpace(query),
  });
}

export function applyPlatformCreditApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/applyplatformcredit',
    data,
  );
}

export function approvePlatformCreditAdjustmentApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/approve',
    data,
  );
}

export function rejectPlatformCreditAdjustmentApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/reject',
    data,
  );
}
