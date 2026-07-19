import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchGiftAuditListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playergift/list',
    { params: trimSpace(query) },
  );
}

export function fetchGiftDeliverListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playergift/deliverlist',
    { params: trimSpace(query) },
  );
}

/** Approve: 1 通过 / 2 拒绝；Ids 逗号分隔 */
export function approveGiftApi(data: {
  Approve: 1 | 2;
  ApproveRemark?: string;
  Id?: number | string;
  Ids: number | string;
  Remark?: string;
}) {
  return requestClient.post('/backend/playergift/approve', {
    ...data,
    ApproveRemark: data.ApproveRemark ?? data.Remark,
    Remark: data.Remark ?? data.ApproveRemark,
  });
}

export function remarkGiftApi(data: { Id: number | string; Remark: string }) {
  return requestClient.post('/backend/playergift/remark', data);
}

export function recordGiftApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/', data);
}

export function fetchGiftPlayerInfoApi(query: { PlayerId: number | string }) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playergift/playerinfo',
    { params: query },
  );
}

export function deliverGiftApi(data: {
  Approve?: number;
  DeliverRemark?: string;
  Express?: string;
  ExpressOrderId?: string;
  GiftType?: number | string;
  Ids: number | string;
  OrderId?: string;
  Remark?: string;
  VirtualGiftRemark?: string;
}) {
  return requestClient.post('/backend/playergift/delivered', data);
}

export function receiveGiftApi(data: { Id: number | string; Remark?: string }) {
  return requestClient.post('/backend/playergift/received', data);
}

export function refuseGiftDeliverApi(data: {
  DeliverRemark?: string;
  Id: number | string;
  Remark?: string;
}) {
  return requestClient.post('/backend/playergift/refuse', data);
}

/** 上传/校验批量发货订单信息 */
export function queryPlayerGiftDeliverInfoApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playergift/queryplayergiftdeliverinfo',
    data,
  );
}

/** 主题抽奖批量发货 */
export function batchDeliverGiftApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/batchdelivered', data);
}

/** 主题抽奖批量拒绝发货 */
export function batchRejectGiftDeliverApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/batchreject', data);
}
