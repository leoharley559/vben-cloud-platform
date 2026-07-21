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

/**
 * 归一化充值通道列表响应，补全可能为 null 的字段
 * @param result 充值通道列表原始响应（Items / Total / TypeList 可能为 null）
 * @returns 字段均已兜底的标准 RechargeChannelListResult
 */
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
/**
 * 查询充值通道列表（保留后端元数据字段）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
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
/**
 * 更新充值渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateRechargeChannelApi(data: RechargeChannelUpdatePayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/', data);
}

/**
 * 更新充值渠道启用。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateRechargeChannelUsedApi(data: RechargeUsedPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/used', data);
}

/**
 * 更新充值渠道上架。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateRechargeChannelShelfApi(data: RechargeShelfPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/shelf', data);
}

/**
 * 重置充值渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function resetRechargeChannelApi(data: RechargeResetPayload) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/reset', data);
}

/**
 * 更新充值渠道参数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateRechargeChannelParamsApi(data: RechargeParamsPayload) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/editparams',
    data,
  );
}

/**
 * 刷新充值通道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function refreshRechargeChannelsApi(data: RechargeRefreshPayload) {
  return requestClient.post(
    '/backend/thirdrechargetypeagentconfig/refresh',
    data,
  );
}

/**
 * 调整充值通道排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function sortRechargeChannelsApi(data: RechargeSortPayload) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/exchange',
    data,
  );
}

/**
 * 切换充值支付类型。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function switchRechargePayTypeApi(data: RechargePayTypeStatusPayload) {
  return requestClient.put(
    `/backend/thirdrechargepaytypeconfig/switch/${data.Id}`,
    data,
  );
}

/**
 * 更新充值支付类型。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateRechargePayTypeApi(data: RechargePayTypeUpdatePayload) {
  return requestClient.put(
    `/backend/thirdrechargepaytypeconfig/${data.Id}`,
    data,
  );
}

/**
 * 调整充值支付Types排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function sortRechargePayTypesApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/thirdrechargepaytypeconfig/sort', data);
}

/**
 * 查询充值快捷Templates。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export async function fetchRechargeQuickTemplatesApi() {
  const result = await requestClient.get<
    NullableListResult<RechargeQuickTemplateListResult>
  >('/backend/rechargetestchannelquicksetting/list');
  return {
    ...result,
    Items: result.Items ?? [],
  } as RechargeQuickTemplateListResult;
}

/**
 * 新增充值快捷模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/rechargeManage
 */
export function createRechargeQuickTemplateApi(
  data: RechargeQuickTemplatePayload,
) {
  return requestClient.post('/backend/rechargetestchannelquicksetting/', data);
}

/**
 * 删除充值快捷模板。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/rechargeManage
 */
export function deleteRechargeQuickTemplateApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/rechargetestchannelquicksetting/${id}`);
}

/** Fixes the legacy `query` config typo: these values are query parameters. */
/**
 * 查询充值玩家Levels。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export async function fetchRechargePlayerLevelsApi(
  query: RechargePlayerLevelQuery,
) {
  const result = await requestClient.get<
    NullableListResult<RechargePlayerLevelListResult>
  >('/backend/playerlevel/list', { params: query });
  return normalizeList(result);
}

// Private bank card and voucher-payment channels (PayType 10 / 212).
/**
 * 查询私卡银行卡列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
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

/**
 * 查询私卡银行卡明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export function fetchPrivateCardDetailApi(id: RechargeChannelId) {
  return requestClient.get<PrivateCardItem>(
    `/backend/agentrechargecardconfig/${id}`,
  );
}

/**
 * 新增私卡银行卡。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/rechargeManage
 */
export function createPrivateCardApi(data: PrivateCardPayload) {
  return requestClient.post('/backend/agentrechargecardconfig/', data);
}

/**
 * 更新私卡银行卡。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updatePrivateCardApi(data: PrivateCardPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/', data);
}

/**
 * 删除私卡银行卡。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/rechargeManage
 */
export function deletePrivateCardApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/agentrechargecardconfig/${id}`);
}

/**
 * 切换私卡银行卡。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function switchPrivateCardApi(data: RechargeOpenPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/switch', data);
}

/**
 * 调整私卡Cards排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function sortPrivateCardsApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/agentrechargecardconfig/exchange', data);
}

/**
 * 查询私卡银行卡汇总。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
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
/**
 * 查询USDT充值列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
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

/**
 * 查询USDT充值明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export function fetchUsdtRechargeDetailApi(id: RechargeChannelId) {
  return requestClient.get<UsdtRechargeItem>(
    `/backend/agentrechargeusdtconfig/${id}`,
  );
}

/**
 * 新增USDT充值。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/rechargeManage
 */
export function createUsdtRechargeApi(data: UsdtRechargePayload) {
  return requestClient.post('/backend/agentrechargeusdtconfig/', data);
}

/**
 * 更新USDT充值。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateUsdtRechargeApi(data: UsdtRechargePayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/', data);
}

/**
 * 删除USDT充值。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/rechargeManage
 */
export function deleteUsdtRechargeApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/agentrechargeusdtconfig/${id}`);
}

/**
 * 切换USDT充值。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function switchUsdtRechargeApi(data: RechargeOpenPayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/switch', data);
}

/**
 * 调整USDT充值排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function sortUsdtRechargeApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/agentrechargeusdtconfig/exchange', data);
}

/**
 * 查询USDT充值汇总。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
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
/**
 * 生成充值兑换码。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/rechargeManage
 */
export function createRechargeVoucherApi(data: VoucherCreatePayload) {
  return requestClient.post('/backend/agentrechargeevoucherconfig', data);
}

/**
 * 校验充值兑换码Codes。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
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

/**
 * 查询充值兑换码Records。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export async function fetchRechargeVoucherRecordsApi(
  query: VoucherRecordQuery,
) {
  const result = await requestClient.get<
    NullableListResult<VoucherRecordListResult>
  >('/backend/agentrechargeevoucherconfig/getLazadaList', { params: query });
  return normalizeList(result);
}

// VIP recharge / coin-dealer customer service.
/**
 * 查询VIP客服列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export async function fetchVipDealerListApi(query: VipDealerQuery) {
  const result = await requestClient.get<
    NullableListResult<VipDealerListResult>
  >('/backend/coindealersupporter/list', { params: query });
  return normalizeList(result);
}

/**
 * 查询VIP客服明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export function fetchVipDealerDetailApi(id: RechargeChannelId) {
  return requestClient.get<VipDealerItem>(`/backend/coindealersupporter/${id}`);
}

/**
 * 新增VIP客服。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/rechargeManage
 */
export function createVipDealerApi(data: VipDealerPayload) {
  return requestClient.post('/backend/coindealersupporter/', data);
}

/**
 * 更新VIP客服。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateVipDealerApi(data: VipDealerPayload) {
  return requestClient.put('/backend/coindealersupporter/', data);
}

/**
 * 更新VIP客服状态。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateVipDealerStatusApi(data: VipDealerStatusPayload) {
  return requestClient.put('/backend/coindealersupporter/', data);
}

/**
 * 删除VIP客服。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/rechargeManage
 */
export function deleteVipDealerApi(id: RechargeChannelId) {
  return requestClient.delete(`/backend/coindealersupporter/${id}`);
}

/**
 * 调整VIPDealers排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function sortVipDealersApi(data: RechargeSortPayload) {
  return requestClient.put('/backend/coindealersupporter/exchange', data);
}

/**
 * 查询可用币商Dealers。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export async function fetchAvailableCoinDealersApi() {
  const result = await requestClient.get<
    NullableListResult<AvailableCoinDealerListResult>
  >('/backend/coindealer/listall');
  return {
    ...result,
    Items: result.Items ?? [],
  } as AvailableCoinDealerListResult;
}

/**
 * 查询VIP客服订单模式。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/rechargeManage
 */
export function fetchVipDealerOrderModeApi() {
  return requestClient.get<VipDealerOrderMode>(
    '/backend/customersupporterglobalconfig',
  );
}

/**
 * 更新VIP客服订单模式。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/rechargeManage
 */
export function updateVipDealerOrderModeApi(data: VipDealerOrderModePayload) {
  return requestClient.post('/backend/customersupporterglobalconfig', data);
}

