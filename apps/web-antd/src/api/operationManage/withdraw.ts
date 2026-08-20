import { requestClient } from '#/api/request';
import type {
  CloudListResult,
  WithdrawListItem,
  WithdrawListQuery,
} from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 规范化提现列表查询参数。
 *
 * 去除首尾空格，并将 ChannelIds 多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeWithdrawQuery(query: WithdrawListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;

  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }

  return params;
}

/**
 * 分页查询提现订单列表。
 *
 * @param query 账号、渠道、状态、时间等筛选及分页参数
 * @returns 提现订单 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 * @see views/operationalManage/playerDetails/components/player-withdraw-record.vue
 */
export function fetchWithdrawListApi(query: WithdrawListQuery) {
  return requestClient.get<CloudListResult<WithdrawListItem>>(
    '/backend/playerwithdraw/list',
    {
      params: normalizeWithdrawQuery(query),
    },
  );
}

/**
 * 人工确认同意提现。
 *
 * @param data 订单 Id 及确认信息
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-action-modal.vue
 */
export function agreeWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/manualconfirmagree', data);
}

/**
 * 人工确认拒绝提现。
 *
 * @param data 订单 Id 及拒绝原因等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-action-modal.vue
 * @see views/operationalManage/withdrawList/components/send-order-action-modal.vue
 */
export function refuseWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwithdraw/manualconfirmrefuse',
    data,
  );
}

/**
 * 人工处理提现（转人工/挂起等）。
 *
 * @param data 订单 Id 及处理动作等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-action-modal.vue
 */
export function manualWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwithdraw/manualconfirmhandle',
    data,
  );
}

/**
 * 风控审核通过派单提现。
 *
 * @param data 派单记录 Id 及审核信息
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-list.vue
 */
export function approveWithdrawRiskApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderlist/', data);
}

/**
 * 批量拒绝提现订单。
 *
 * @param data 订单 Id 列表及拒绝原因等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function batchDenyWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/batchdenied', data);
}

/**
 * 批量人工处理提现订单。
 *
 * @param data 订单 Id 列表及处理动作等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function batchManualWithdrawApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerwithdraw/editmore', data);
}

/**
 * 获取批量提现可用渠道选项。
 *
 * @param params Ids 订单 ID；Batch、Type 可选
 * @returns 可用提现渠道 Items
 * @see views/operationalManage/withdrawList/components/withdraw-batch-approve-modal.vue
 */
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

/**
 * 批量确认同意提现。
 *
 * @param data 订单 Id 列表及渠道等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-batch-approve-modal.vue
 */
export function batchApproveWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/batchconfirmagree', data);
}

/**
 * 检查三方提现订单状态。
 *
 * @param orderId 提现订单 ID
 * @returns 三方订单状态信息
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function checkThirdPartyWithdrawApi(orderId: number | string) {
  return requestClient.get(`/backend/playerwithdraw/check/${orderId}`);
}

/**
 * 将提现订单转为待处理状态。
 *
 * @param data 订单 Id 等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function transitionPendingWithdrawApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwithdraw/transitionpending/', data);
}

/**
 * 发送提现通知（旧站 API 路径拼写为 replacementordes）。
 *
 * @param data Id 及可选 OrderId
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function withdrawNoticeApi(data: {
  Id: number | string;
  OrderId?: number | string;
}) {
  return requestClient.post('/backend/playerwithdraw/replacementordes', data);
}

/**
 * 添加提现订单备注。
 *
 * @param data Id 与 Remark
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function addWithdrawRemarkApi(data: {
  Id: number | string;
  Remark: string;
}) {
  return requestClient.post('/backend/playerwithdraw/addremark', null, {
    params: data,
  });
}

/**
 * 获取提现拒绝原因下拉选项。
 *
 * @returns 拒绝原因 Items（Key/Value）
 * @see views/operationalManage/withdrawList/components/withdraw-action-modal.vue
 */
export function fetchWithdrawRejectReasonsApi() {
  return requestClient.get<
    CloudListResult<{ Key?: string; Value?: string; [key: string]: unknown }>
  >('/backend/playerwithdraw/rejectreason');
}

/**
 * 更新提现订单已到账状态。
 *
 * @param data 订单 Id
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/redeem-list.vue
 */
export function updateWithdrawReceivedStatusApi(data: { Id: number | string }) {
  return requestClient.post(
    '/backend/playerwithdraw/updatereceivedstatus',
    data,
  );
}

/**
 * 头部导航提款待处理数量。
 *
 * @returns Count 待处理笔数，LastId 最新订单 Id
 * @see layouts/components/header-alert-bar.vue
 */
export function fetchWithdrawAlertApi() {
  return requestClient.get<{ Count?: number; LastId?: number }>(
    '/backend/playerwithdraw/alert',
  );
}
