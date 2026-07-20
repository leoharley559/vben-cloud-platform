import type {
  DkAccountPayload,
  DkAdjustPayload,
  DkApplyCreditPayload,
  DkCreditInfo,
  DkExcelPlayerQuery,
  DkListQuery,
  DkListResult,
  DkPlayerAvailableCredit,
  DkSharedConfig,
} from './dk-credit.types';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList(result?: DkListResult | null): DkListResult {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

export async function getDkCreditLimitApplyRecordListApi(
  query: DkListQuery,
) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export async function getDkAccountLimitListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentdkaccountlimit/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export async function fetchDkCreditRecordApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentcreditlimittransaction/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export async function getDkNetCashLogListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/netcashlog/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export function getAgentDkAccountLimitApi(query: Record<string, unknown> = {}) {
  return requestClient.get<DkCreditInfo>(
    '/backend/agentdkaccountlimit/getagentdkaccountlimit',
    { params: trimSpace(query) },
  );
}

export function adjustDkPlayerMoneyApi(data: DkAdjustPayload) {
  return requestClient.post(
    '/backend/agentdkaccountlimit/adjustplayermoney',
    data,
  );
}

export function applyDkCreditApi(data: DkApplyCreditPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/applycredit', data);
}

export function getPlayerAvailableDeductCreditApi(query: {
  PlayerId: number | string;
}) {
  return requestClient.get<{
    Items?: DkPlayerAvailableCredit;
  }>('/backend/agentcreditlimittransaction/getplayeravailabledeductcredit', {
    params: trimSpace(query),
  });
}

export async function getDkPlayerListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/playerinfo/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export async function queryDkPlayersByExcelApi(data: DkExcelPlayerQuery) {
  const result = await requestClient.post<DkListResult>(
    '/backend/playerinfo/queryplayerexcel',
    data,
  );
  return normalizeList(result);
}

export function createDkAccountApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/add', data);
}

export function editDkAccountApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/edit', data);
}

export function deductDkAccountCreditApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/deductcredit', data);
}

/** 旧页新增账号的数据源：仅允许选择后台账号，昵称由选项自动回填。 */
export function getDkSharedConfigApi() {
  return requestClient.get<DkSharedConfig>('/backend/sharedComponent/list');
}
