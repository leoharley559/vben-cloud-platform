import { requestClient } from '#/api/request';
import type {
  CloseOrderFinishPayload,
  CloseOrderListQuery,
  CloseOrderListResult,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchCloseOrderListApi(query: CloseOrderListQuery) {
  return requestClient.get<CloseOrderListResult>(
    '/backend/accountteamwithdrawapply/list',
    { params: trimSpace(query) },
  );
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
