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
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        MoreItems?: Record<string, unknown>;
      }
    >('/backend/scoremanage/list', { params: query })
    .then(toListResult);
}

/** 库存明细（含 MoreItems.TotalSum 合计） */
export function fetchGoldInventoryDetailApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        MoreItems?: Record<string, unknown>;
      }
    >('/backend/scoremanage/detaillist', { params: query })
    .then(toListResult);
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

type CloudCoinListRespond = CloudListResult<Record<string, unknown>> & {
  MoreItems?: Record<string, unknown>;
  Stock?: number | string;
  Today?: { Buy?: number | string; Consume?: number | string };
};

function toCloudCoinListResult(data: CloudCoinListRespond) {
  const more = (data.MoreItems || {}) as Record<string, unknown>;
  const today =
    (data.Today as CloudCoinListRespond['Today']) ||
    (more.Today as CloudCoinListRespond['Today']) ||
    {};
  return {
    Items: data.Items ?? [],
    MoreItems: data.MoreItems,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
    Stock: data.Stock ?? more.Stock ?? 0,
    Today: {
      Buy: today.Buy ?? more.Buy ?? 0,
      Consume: today.Consume ?? more.Consume ?? 0,
    },
    Total: data.Total,
  };
}

export function fetchCloudCoinStockApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/stock', {
      params: query,
    })
    .then(toCloudCoinListResult);
}

export function fetchCloudCoinDailyListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/daily', {
      params: query,
    })
    .then(toCloudCoinListResult);
}

export function fetchCloudCoinDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/list', {
      params: query,
    })
    .then(toCloudCoinListResult);
}
