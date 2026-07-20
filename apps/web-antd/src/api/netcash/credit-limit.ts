import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList(result?: NetcashListResult | null): NetcashListResult {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

export async function getNetCashAccountListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/netcashaccount/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

export async function getCreditLimitApplyRecordListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

export async function getNetCashLogListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/netcashlog/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

export async function getAgentPermissionsApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitpermission/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

export function getAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

export async function fetchDebtListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/duecreditlist',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
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

export async function getAgentRestrictionListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitrestrict/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export function addAgentRestrictionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitrestrict/add', data);
}

export function removeAgentRestrictionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitrestrict/delete', data);
}

export function updateAgentPermissionsApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitpermission/edit', data);
}
