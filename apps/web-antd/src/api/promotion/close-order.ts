import type {
  CloseOrderFinishPayload,
  CloseOrderListQuery,
  CloseOrderListResult,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export async function fetchCloseOrderListApi(query: CloseOrderListQuery) {
  const data = await requestClient.get<CloseOrderListResult | null>(
    '/backend/accountteamwithdrawapply/list',
    { params: trimSpace(query) },
  );
  return {
    Items: data?.Items || [],
    MoreItems: data?.MoreItems || [],
    Pagination: data?.Pagination,
  };
}

export function startCloseOrderApi(data: { Id?: number | string }) {
  return requestClient.post('/backend/accountteamwithdrawapply/applydo', data);
}

export function finishCloseOrderApi(data: CloseOrderFinishPayload) {
  return requestClient.post(
    '/backend/accountteamwithdrawapply/applyfinish',
    data,
  );
}
