import type {
  CloudListResult,
  RechargeListItem,
  RechargeListQuery,
} from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 规范化充值列表查询参数。
 *
 * 去除首尾空格，并将 ChannelIds 多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeRechargeQuery(query: RechargeListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;

  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length > 0 ? channelIds.join(',') : '';
  }

  return params;
}

/**
 * 分页查询充值订单列表。
 *
 * @param query 账号、渠道、状态、时间等筛选及分页参数
 * @returns 充值订单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/aisle-recharge.vue
 * @see views/operationalManage/playerDetails/components/player-recharge-record.vue
 */
export function fetchRechargeListApi(query: RechargeListQuery) {
  return requestClient.get<CloudListResult<RechargeListItem>>(
    '/backend/playerpayment/list',
    {
      params: normalizeRechargeQuery(query),
    },
  );
}

/**
 * 人工复审充值订单（通过/拒绝）。
 *
 * @param data 订单 Id 及审核结果等
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-review-modal.vue
 */
export function manualReviewRechargeApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpayment/reconsideration', data);
}

/**
 * 确认充值空单（空订单处理）。
 *
 * @param data 订单 Id 及确认信息
 * @returns 接口响应
 */
export function confirmRechargeEmptyOrderApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpayment/confirmemptyorder', data);
}

/**
 * 删除充值空单。
 *
 * @param id 空单 ID
 * @returns 接口响应
 */
export function deleteRechargeBlankOrderApi(id: number | string) {
  return requestClient.delete(`/backend/playerpayment/delemptyorder/${id}`);
}

/**
 * 获取充值订单详情（补单预取）。
 *
 * @param id 充值订单 ID
 * @returns 订单详情对象
 * @see views/operationalManage/rechargeList/components/recharge-replace-order-modal.vue
 */
export function fetchRechargeDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/playerpayment/${id}`,
  );
}

/**
 * 游戏补单（替换三方订单）。
 *
 * @param data 原订单及补单信息
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-replace-order-modal.vue
 */
export function replaceRechargeOrderApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpayment/replacementorder', data);
}

/**
 * 创建充值补空单。
 *
 * @param data Amount、OrderId 及可选 Hash
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-blank-order-modal.vue
 */
export function createRechargeBlankOrderApi(data: {
  Amount: number;
  Hash?: string;
  OrderId: string;
}) {
  return requestClient.post('/backend/playerpayment/replaceemptyorder', data);
}

/**
 * 头部导航充值待处理数量。
 *
 * @returns Count 待处理笔数，LastId 最新订单 Id
 * @see layouts/components/header-alert-bar.vue
 */
export function fetchRechargeAlertApi() {
  return requestClient.get<{ Count?: number; LastId?: number }>(
    '/backend/playereasyrecharge/alert',
  );
}
