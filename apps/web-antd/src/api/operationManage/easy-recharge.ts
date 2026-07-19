import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  EasyRechargeListTotal,
  PlayerEasyRechargeItem,
  PlayerEasyRechargeQuery,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

export function fetchEasyRechargeListApi(query: PlayerEasyRechargeQuery) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: EasyRechargeListTotal;
    }
  >('/backend/playereasyrecharge/list', {
    params: trimSpace(query),
  });
}

export function confirmEasyRechargeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playereasyrecharge/confirm/', data);
}

export function rejectEasyRechargeApi(id: number | string) {
  return requestClient.put(`/backend/playereasyrecharge/denied/${id}`);
}

export function reviewEasyRechargeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playereasyrecharge/reconsideration/',
    data,
  );
}

export function updateEasyRechargeImageApi(data: {
  GameOrderId: string;
  Id: number | string;
  ImageUrl: string;
}) {
  return requestClient.post('/backend/playereasyrecharge/image', data);
}

export function fetchUsdtRechargeListApi(query: Record<string, unknown>) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: EasyRechargeListTotal;
    }
  >('/backend/playerusdteasyrecharge/list', {
    params: trimSpace(query),
  });
}

export function confirmUsdtRechargeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerusdteasyrecharge/confirm', data);
}

export function reviewUsdtRechargeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playerusdteasyrecharge/reconsideration',
    data,
  );
}

export function rejectUsdtRechargeApi(id: number | string) {
  return requestClient.put(`/backend/playerusdteasyrecharge/denied/${id}`);
}

export function updateUsdtRechargeImageApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerusdteasyrecharge/image', data);
}
