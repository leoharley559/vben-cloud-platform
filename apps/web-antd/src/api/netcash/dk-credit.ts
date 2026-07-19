import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function getDkCreditLimitApplyRecordListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    { params: trimSpace(query) },
  );
}

export function getDkAccountLimitListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentdkaccountlimit/list',
    { params: trimSpace(query) },
  );
}

export function fetchDkCreditRecordApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimittransaction/list',
    { params: trimSpace(query) },
  );
}

export function getDkNetCashLogListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/netcashlog/list', {
    params: trimSpace(query),
  });
}

export function getAgentDkAccountLimitApi(query: Record<string, unknown> = {}) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentdkaccountlimit/getagentdkaccountlimit',
    { params: trimSpace(query) },
  );
}

export function adjustDkPlayerMoneyApi(data: {
  Items: string;
  PayPassword?: string;
}) {
  return requestClient.post(
    '/backend/agentdkaccountlimit/adjustplayermoney',
    data,
  );
}

export function applyDkCreditApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentdkaccountlimit/applycredit', data);
}

export function getPlayerAvailableDeductCreditApi(query: {
  PlayerId: number | string;
}) {
  return requestClient.get<{
    Items?: Record<string, unknown>;
  }>('/backend/agentcreditlimittransaction/getplayeravailabledeductcredit', {
    params: trimSpace(query),
  });
}
