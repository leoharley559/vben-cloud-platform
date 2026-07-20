import { requestClient } from '#/api/request';
import type {
  BonusAdminItem,
  BonusBatchResult,
  BonusManageItem,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';

function emptyListResult(): NetcashListResult<BonusManageItem> {
  return {
    Items: [],
    Pagination: { MaxCount: 0 },
    Total: { Total: 0, TotalReal: 0 },
  };
}

function normalizeListResult(
  result?: NetcashListResult<BonusManageItem> | null,
) {
  if (!result || typeof result !== 'object') {
    return emptyListResult();
  }
  return {
    ...result,
    Items: Array.isArray(result.Items) ? result.Items : [],
    Pagination: result.Pagination || { MaxCount: 0 },
    Total: result.Total || { Total: 0, TotalReal: 0 },
  };
}

export async function fetchBonusHistoryListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult<BonusManageItem> | null>(
    '/backend/agentnetcashbonus/list',
    { params: query },
  );
  return normalizeListResult(result);
}

export async function fetchBonusApproveListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult<BonusManageItem> | null>(
    '/backend/agentnetcashbonus/approvelist',
    {
      params: query,
    },
  );
  return normalizeListResult(result);
}

export function approveBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus/approve', data);
}

export function provideBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus', data);
}

export async function batchProvideBonusApi(data: Record<string, unknown>) {
  const result = await requestClient.post<BonusBatchResult | null>(
    '/backend/agentnetcashbonus/batch',
    data,
  );
  return result && typeof result === 'object' ? result : {};
}

export async function queryBonusAdminIdApi(data: Record<string, unknown>) {
  const result = await requestClient.post<
    { Items?: BonusAdminItem[] } | BonusAdminItem[] | null
  >('/backend/agentnetcashbonus/queryadminid', data);
  if (Array.isArray(result)) {
    return { Items: result };
  }
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
  };
}

export function adjustBonusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashbonus', data);
}
