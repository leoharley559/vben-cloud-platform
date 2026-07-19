import { requestClient } from '#/api/request';
import type {
  CloudListResult,
  RechargeListItem,
  RechargeListQuery,
} from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeRechargeQuery(query: RechargeListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;

  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }

  return params;
}

export function fetchRechargeListApi(query: RechargeListQuery) {
  return requestClient.get<CloudListResult<RechargeListItem>>(
    '/backend/playerpayment/list',
    {
      params: normalizeRechargeQuery(query),
    },
  );
}

export function manualReviewRechargeApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpayment/reconsideration', data);
}

export function confirmRechargeEmptyOrderApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpayment/confirmemptyorder', data);
}

export function deleteRechargeBlankOrderApi(id: number | string) {
  return requestClient.delete(`/backend/playerpayment/delemptyorder/${id}`);
}

/** 充值订单详情（补单预取） */
export function fetchRechargeDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/playerpayment/${id}`,
  );
}

/** 游戏补单 */
export function replaceRechargeOrderApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpayment/replacementorder', data);
}

/** 补空单 */
export function createRechargeBlankOrderApi(data: {
  Amount: number;
  Hash?: string;
  OrderId: string;
}) {
  return requestClient.post('/backend/playerpayment/replaceemptyorder', data);
}
