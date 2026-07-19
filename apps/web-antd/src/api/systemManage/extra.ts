import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function toListResult(
  data: CloudListResult<Record<string, unknown>> & {
    MoreItems?: Record<string, unknown>;
  },
) {
  return {
    Items: data.Items ?? [],
    MoreItems: data.MoreItems,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

export function fetchLegacyRoleListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/public/role/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function fetchLanguageGroupListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<{ Items?: Record<string, unknown>[] } | Record<string, unknown>[]>(
      '/backend/agentgrouplang/list',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as { Items?: Record<string, unknown>[] }).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: { MaxCount: items.length },
      };
    });
}

export interface LanguageGroupPayload {
  Id?: number;
  IsOpen: boolean;
  Languages: string;
  Name: string;
}

export function editLanguageGroupApi(data: LanguageGroupPayload) {
  return requestClient.put('/backend/agentgrouplang/', data);
}

export function deleteLanguageGroupApi(id: number) {
  return requestClient.delete(`/backend/agentgrouplang/${id}`);
}

export function createGoldSellApi(data: {
  AddScores: number | string;
  AgentId: number | string;
  AgentName: string;
  Hash: string;
}) {
  return requestClient.post('/backend/agentscoresell/add', data);
}

export function createGoldRefundApi(data: {
  AddScores: number | string;
  AgentId: number | string;
  AgentName: string;
  Hash: string;
  Note?: string;
}) {
  return requestClient.post('/backend/agentscoresell/refund', data);
}

export function buyCloudCoinApi(data: { Hash: string; Num: number | string }) {
  return requestClient.put('/backend/cloudcoinlog/buy', data);
}

export function fetchGoldInventoryApi(query: Record<string, unknown>) {
  return requestClient.get<{
    Items?: Record<string, unknown>[];
    MoreItems?: Record<string, unknown>;
    Pagination?: { MaxCount?: number };
  }>('/backend/scoremanage/list', { params: query });
}

export function fetchGoldSellListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentscoresell/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchGoldSellRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentscoresell/selldetaillist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchCloudCoinStockApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/cloudcoinlog/stock',
      { params: query },
    )
    .then(toListResult);
}

export function fetchCloudCoinDailyListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/cloudcoinlog/daily',
      { params: query },
    )
    .then(toListResult);
}

export function fetchCloudCoinDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/cloudcoinlog/list',
      { params: query },
    )
    .then(toListResult);
}
