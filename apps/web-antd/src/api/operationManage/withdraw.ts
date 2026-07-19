import { requestClient } from '#/api/request';
import type {
  CloudListResult,
  WithdrawListItem,
  WithdrawListQuery,
} from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeWithdrawQuery(query: WithdrawListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;

  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }

  return params;
}

export function fetchWithdrawListApi(query: WithdrawListQuery) {
  return requestClient.get<CloudListResult<WithdrawListItem>>(
    '/backend/playerwithdraw/list',
    {
      params: normalizeWithdrawQuery(query),
    },
  );
}

export function agreeWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/manualconfirmagree', data);
}

export function refuseWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwithdraw/manualconfirmrefuse',
    data,
  );
}

export function manualWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwithdraw/manualconfirmhandle',
    data,
  );
}

export function approveWithdrawRiskApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderlist/', data);
}

export function batchDenyWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/batchdenied', data);
}

export function batchManualWithdrawApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerwithdraw/editmore', data);
}

export function fetchWithdrawChannelOptionsApi(params: {
  Batch?: number;
  Ids: number | string;
  Type?: number | string;
}) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerwithdraw/withdrawlist',
    {
      params: trimSpace(params),
    },
  );
}

export function batchApproveWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/batchconfirmagree', data);
}

export function checkThirdPartyWithdrawApi(orderId: number | string) {
  return requestClient.get(`/backend/playerwithdraw/check/${orderId}`);
}

export function transitionPendingWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/transitionpending/', data);
}

/** 提现通知（旧站 API 路径拼写为 replacementordes） */
export function withdrawNoticeApi(data: {
  Id: number | string;
  OrderId?: number | string;
}) {
  return requestClient.post('/backend/playerwithdraw/replacementordes', data);
}

export function addWithdrawRemarkApi(data: {
  Id: number | string;
  Remark: string;
}) {
  return requestClient.post('/backend/playerwithdraw/addremark', null, {
    params: data,
  });
}

export function fetchWithdrawRejectReasonsApi() {
  return requestClient.get<
    CloudListResult<{ Key?: string; Value?: string; [key: string]: unknown }>
  >('/backend/playerwithdraw/rejectreason');
}

export function updateWithdrawReceivedStatusApi(data: { Id: number | string }) {
  return requestClient.post(
    '/backend/playerwithdraw/updatereceivedstatus',
    data,
  );
}
