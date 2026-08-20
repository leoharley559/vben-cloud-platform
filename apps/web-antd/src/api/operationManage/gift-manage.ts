import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 查询礼品审核列表
 * @param query 筛选条件（玩家、礼品类型、状态及分页）
 * @returns 礼品审核记录列表 Items 及 Pagination
 * @see views/operationalManage/giftManage/components/gift-audit-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-audit-lucky-panel.vue
 */
export function fetchGiftAuditListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playergift/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询礼品发货列表
 * @param query 筛选条件（玩家、发货状态及分页）
 * @returns 礼品发货记录列表 Items 及 Pagination
 * @see views/operationalManage/giftManage/components/gift-deliver-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
export async function fetchGiftDeliverListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/playergift/deliverlist', { params: trimSpace(query) });
  return {
    ...result,
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 审批礼品申请（Approve 1=通过 / 2=拒绝）
 * @param data 审批参数（Ids、Approve、ApproveRemark 等）
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-audit-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-audit-lucky-panel.vue
 */
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

/**
 * 更新礼品申请备注
 * @param data 记录 Id 及备注 Remark
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-audit-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-audit-lucky-panel.vue
 */
export function remarkGiftApi(data: { Id: number | string; Remark: string }) {
  return requestClient.post('/backend/playergift/remark', data);
}

/**
 * 登记/补录礼品申请
 * @param data 礼品登记表单（玩家、礼品类型、数量等）
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-audit-level-panel.vue
 */
export function recordGiftApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/', data);
}

/**
 * 查询玩家礼品相关信息
 * @param query 玩家 Id（PlayerId）
 * @returns 玩家礼品信息详情
 * @see views/operationalManage/giftManage/components/gift-audit-level-panel.vue
 */
export function fetchGiftPlayerInfoApi(query: { PlayerId: number | string }) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playergift/playerinfo',
    { params: query },
  );
}

/**
 * 确认礼品发货
 * @param data 发货参数（Ids、快递信息、虚拟礼品备注等）
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-deliver-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
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

/**
 * 确认玩家已签收礼品
 * @param data 记录 Id 及签收备注 Remark
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-deliver-level-panel.vue
 */
export function receiveGiftApi(data: { Id: number | string; Remark?: string }) {
  return requestClient.post('/backend/playergift/received', data);
}

/**
 * 拒绝礼品发货
 * @param data 记录 Id 及拒绝/发货备注
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-deliver-level-panel.vue
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
export function refuseGiftDeliverApi(data: {
  DeliverRemark?: string;
  Id: number | string;
  Remark?: string;
}) {
  return requestClient.post('/backend/playergift/refuse', data);
}

/**
 * 上传/校验批量发货订单信息
 * @param data 批量发货文件或订单数据
 * @returns 校验结果及待发货明细
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
export function queryPlayerGiftDeliverInfoApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playergift/queryplayergiftdeliverinfo',
    data,
  );
}

/**
 * 主题抽奖批量确认发货
 * @param data 批量发货参数（Ids、快递信息等）
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
export function batchDeliverGiftApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/batchdelivered', data);
}

/**
 * 主题抽奖批量拒绝发货
 * @param data 批量拒绝参数（Ids 及拒绝原因）
 * @returns 接口操作结果
 * @see views/operationalManage/giftManage/components/gift-deliver-lucky-panel.vue
 */
export function batchRejectGiftDeliverApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergift/batchreject', data);
}
