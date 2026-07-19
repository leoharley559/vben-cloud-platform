import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function getNetCashAccountListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/netcashaccount/list', {
    params: trimSpace(query),
  });
}

export function getCreditLimitApplyRecordListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    {
      params: trimSpace(query),
    },
  );
}

export function getNetCashLogListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/netcashlog/list', {
    params: trimSpace(query),
  });
}

export function getAgentPermissionsApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitpermission/list',
    {
      params: trimSpace(query),
    },
  );
}

export function getAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

export function fetchDebtListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/duecreditlist',
    { params: trimSpace(query) },
  );
}

export function applyCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitapplyrecord/add', data);
}

export function approveCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/approve',
    data,
  );
}

export function rejectCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/reject',
    data,
  );
}

export function editCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimit/edit', data);
}
