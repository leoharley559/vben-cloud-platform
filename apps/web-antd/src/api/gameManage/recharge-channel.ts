import type {
  AvailableCoinDealerListResult,
  PrivateCardItem,
  PrivateCardListResult,
  PrivateCardPayload,
  RechargeChannelId,
  RechargeChannelListResult,
  RechargeChannelQuery,
  RechargeChannelUpdatePayload,
  RechargeOpenPayload,
  RechargeParamsPayload,
  RechargePayTypeStatusPayload,
  RechargePayTypeUpdatePayload,
  RechargePlayerLevelListResult,
  RechargePlayerLevelQuery,
  RechargeQuickTemplateListResult,
  RechargeQuickTemplatePayload,
  RechargeRefreshPayload,
  RechargeResetPayload,
  RechargeShelfPayload,
  RechargeSortPayload,
  RechargeSpecializedQuery,
  RechargeSpecializedTotalResult,
  RechargeUsedPayload,
  UsdtRechargeItem,
  UsdtRechargeListResult,
  UsdtRechargePayload,
  VipDealerItem,
  VipDealerListResult,
  VipDealerOrderMode,
  VipDealerOrderModePayload,
  VipDealerPayload,
  VipDealerQuery,
  VipDealerStatusPayload,
  VoucherCreatePayload,
  VoucherImportPayload,
  VoucherImportResult,
  VoucherRecordListResult,
  VoucherRecordQuery,
} from '#/types/recharge-channel';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type NullableListResult<T extends { Items: unknown[]; Pagination?: object }> =
  Omit<T, 'Items' | 'Pagination'> & {
    Items?: null | T['Items'];
    Pagination?: null | T['Pagination'];
  };

function normalizeList<T extends { Items: unknown[]; Pagination: object }>(
  result: NullableListResult<T>,
): T {
  return {
    ...result,
    Items: result.Items ?? [],
    Pagination: result.Pagination ?? {},
  } as unknown as T;
}

function normalizeRechargeList(
  result: Partial<RechargeChannelListResult> & {
    Items?: null | RechargeChannelListResult['Items'];
    Total?: null | RechargeChannelListResult['Total'];
    TypeList?: null | RechargeChannelListResult['TypeList'];
  },
): RechargeChannelListResult {
  return {
    ...result,
    Items: result.Items ?? [],
    Pagination: result.Pagination ?? {},
    Total: result.Total ?? [],
    TypeList: result.TypeList ?? [],
  };
}

/** Active channel list. Keeps every backend metadata field intact. */
export async function fetchRechargeChannelListApi(query: RechargeChannelQuery) {
  const result = await requestClient.get<
    Partial<RechargeChannelListResult> & {
      Items?: null | RechargeChannelListResult['Items'];
      Total?: null | RechargeChannelListResult['Total'];
      TypeList?: null | RechargeChannelListResult['TypeList'];
    }
  >('/backend/thirdrechargetypeagentconfig/list', {
    params: trimSpace(query),
  });
  return normalizeRechargeList(result);
}

/** Legacy endpoint expects the complete row, including unknown server fields. */
export function updateRechargeChannelApi(data: RechargeChannelUpdatePayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/', data);
}

export function updateRechargeChannelUsedApi(data: RechargeUsedPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/used', data);
}

export function updateRechargeChannelShelfApi(data: RechargeShelfPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/shelf', data);
}

export function resetRechargeChannelApi(data: RechargeResetPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/reset', data);
}

export function updateRechargeChannelParamsApi(data: RechargeParamsPayload) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/editparams',
    data,
  );
}

export function refreshRechargeChannelsApi(data: RechargeRefreshPayload) {
  return requestClient.post(
    '/backend/thirdrechargetypeagentconfig/refresh',
    data,
  );
}

export function sortRechargeChannelsApi(data: RechargeSortPayload) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/exchange',
    data,
  );
}

export function switchRechargePayTypeApi(data: RechargePayTypeStatusPayload) {
  return requestClient.put(
    `/backend/thirdrechargepaytypeconfig/switch/${data.Id}`,
    data,
  );
}

export function updateRechargePayTypeApi(data: RechargePayTypeUpdatePayload) {
  return requestClient.put(
    `/backend/thirdrechargepaytypeconfig/${data.Id}`,
    data,
  );
}

export function sortRechargePayTypesApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/thirdrechargepaytypeconfig/sort', data);
}

export async function fetchRechargeQuickTemplatesApi() {
  const result = await requestClient.get<
    NullableListResult<RechargeQuickTemplateListResult>
  >('/backend/rechargetestchannelquicksetting/list');
  return {
    ...result,
    Items: result.Items ?? [],
  } as RechargeQuickTemplateListResult;
}

export function createRechargeQuickTemplateApi(
  data: RechargeQuickTemplatePayload,
) {
  return requestClient.post('/backend/rechargetestchannelquicksetting/', data);
}

export function deleteRechargeQuickTemplateApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/rechargetestchannelquicksetting/${id}`);
}

/** Fixes the legacy `query` config typo: these values are query parameters. */
export async function fetchRechargePlayerLevelsApi(
  query: RechargePlayerLevelQuery,
) {
  const result = await requestClient.get<
    NullableListResult<RechargePlayerLevelListResult>
  >('/backend/playerlevel/list', { params: query });
  return normalizeList(result);
}

// Private bank card and voucher-payment channels (PayType 10 / 212).
export async function fetchPrivateCardListApi(query: RechargeSpecializedQuery) {
  const result = await requestClient.get<
    Partial<PrivateCardListResult> & {
      Items?: null | PrivateCardItem[];
      Total?: null | PrivateCardListResult['Total'];
      TypeList?: null | PrivateCardListResult['TypeList'];
    }
  >('/backend/agentrechargecardconfig/list', { params: query });
  return {
    ...result,
    Items: result.Items ?? [],
    Pagination: result.Pagination ?? {},
    Total: result.Total ?? [],
    TypeList: result.TypeList ?? [],
  } as PrivateCardListResult;
}

export function fetchPrivateCardDetailApi(id: RechargeChannelId) {
  return requestClient.get<PrivateCardItem>(
    `/backend/agentrechargecardconfig/${id}`,
  );
}

export function createPrivateCardApi(data: PrivateCardPayload) {
  return requestClient.post('/backend/agentrechargecardconfig/', data);
}

export function updatePrivateCardApi(data: PrivateCardPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/', data);
}

export function deletePrivateCardApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/agentrechargecardconfig/${id}`);
}

export function switchPrivateCardApi(data: RechargeOpenPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/switch', data);
}

export function sortPrivateCardsApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/exchange', data);
}

export async function fetchPrivateCardTotalApi(
  query?: Record<string, unknown>,
) {
  const result = await requestClient.get<
    Partial<RechargeSpecializedTotalResult>
  >(
    '/backend/agentrechargecardconfig/total',
    query ? { params: query } : undefined,
  );
  return {
    ...result,
    Items: result.Items ?? {},
  } as RechargeSpecializedTotalResult;
}

// USDT quick-payment channels.
export async function fetchUsdtRechargeListApi(
  query: RechargeSpecializedQuery = {},
) {
  const result = await requestClient.get<
    Partial<UsdtRechargeListResult> & {
      Items?: null | UsdtRechargeItem[];
      Total?: null | UsdtRechargeListResult['Total'];
      TypeList?: null | UsdtRechargeListResult['TypeList'];
    }
  >('/backend/agentrechargeusdtconfig/list', { params: query });
  return {
    ...result,
    Items: result.Items ?? [],
    Pagination: result.Pagination ?? {},
    Total: result.Total ?? [],
    TypeList: result.TypeList ?? [],
  } as UsdtRechargeListResult;
}

export function fetchUsdtRechargeDetailApi(id: RechargeChannelId) {
  return requestClient.get<UsdtRechargeItem>(
    `/backend/agentrechargeusdtconfig/${id}`,
  );
}

export function createUsdtRechargeApi(data: UsdtRechargePayload) {
  return requestClient.post('/backend/agentrechargeusdtconfig/', data);
}

export function updateUsdtRechargeApi(data: UsdtRechargePayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/', data);
}

export function deleteUsdtRechargeApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/agentrechargeusdtconfig/${id}`);
}

export function switchUsdtRechargeApi(data: RechargeOpenPayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/switch', data);
}

export function sortUsdtRechargeApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/exchange', data);
}

export async function fetchUsdtRechargeTotalApi(
  query: Record<string, unknown> = {},
) {
  const result = await requestClient.get<
    Partial<RechargeSpecializedTotalResult>
  >('/backend/agentrechargeusdtconfig/total', { params: query });
  return {
    ...result,
    Items: result.Items ?? {},
  } as RechargeSpecializedTotalResult;
}

// Voucher generation/import/history. There are no legacy voucher CRUD routes.
export function createRechargeVoucherApi(data: VoucherCreatePayload) {
  return requestClient.post('/backend/agentrechargeevoucherconfig', data);
}

export async function validateRechargeVoucherCodesApi(
  data: VoucherImportPayload,
) {
  const result = await requestClient.post<Partial<VoucherImportResult>>(
    '/backend/agentrechargeevoucherconfig/querycodeexcel',
    trimSpace(data),
  );
  return {
    ...result,
    Items: result.Items ?? [],
    ItemsExist: result.ItemsExist ?? [],
  } as VoucherImportResult;
}

export async function fetchRechargeVoucherRecordsApi(
  query: VoucherRecordQuery,
) {
  const result = await requestClient.get<
    NullableListResult<VoucherRecordListResult>
  >('/backend/agentrechargeevoucherconfig/getLazadaList', { params: query });
  return normalizeList(result);
}

// VIP recharge / coin-dealer customer service.
export async function fetchVipDealerListApi(query: VipDealerQuery) {
  const result = await requestClient.get<
    NullableListResult<VipDealerListResult>
  >('/backend/coindealersupporter/list', { params: query });
  return normalizeList(result);
}

export function fetchVipDealerDetailApi(id: RechargeChannelId) {
  return requestClient.get<VipDealerItem>(`/backend/coindealersupporter/${id}`);
}

export function createVipDealerApi(data: VipDealerPayload) {
  return requestClient.post('/backend/coindealersupporter/', data);
}

export function updateVipDealerApi(data: VipDealerPayload) {
  return requestClient.put('/backend/coindealersupporter/', data);
}

export function updateVipDealerStatusApi(data: VipDealerStatusPayload) {
  return requestClient.put('/backend/coindealersupporter/', data);
}

export function deleteVipDealerApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/coindealersupporter/${id}`);
}

export function sortVipDealersApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/coindealersupporter/exchange', data);
}

export async function fetchAvailableCoinDealersApi() {
  const result = await requestClient.get<
    NullableListResult<AvailableCoinDealerListResult>
  >('/backend/coindealer/listall');
  return {
    ...result,
    Items: result.Items ?? [],
  } as AvailableCoinDealerListResult;
}

export function fetchVipDealerOrderModeApi() {
  return requestClient.get<VipDealerOrderMode>(
    '/backend/customersupporterglobalconfig',
  );
}

export function updateVipDealerOrderModeApi(data: VipDealerOrderModePayload) {
  return requestClient.post('/backend/customersupporterglobalconfig', data);
}
