import type { CloudListResult } from '#/types/operation-manage';
import type {
  EasyRechargeListTotal,
  PlayerEasyRechargeItem,
  PlayerEasyRechargeQuery,
} from '#/types/player-detail';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 查询银行快捷充值/凭证充值订单列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns 充值订单列表 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/rechargeList/components/bank-fast-recharge.vue
 * @see views/operationalManage/rechargeList/components/voucher-recharge-list.vue
 * @see views/operationalManage/playerDetails/components/player-easy-recharge-record.vue
 */
export function fetchEasyRechargeListApi(query: PlayerEasyRechargeQuery) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: EasyRechargeListTotal;
    }
  >('/backend/playereasyrecharge/list', {
    params: trimSpace(query),
  });
}

/**
 * 确认银行快捷充值订单
 * @param data 确认参数（订单 Id 及审核信息）
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/bank-fast-recharge.vue
 * @see components/easy-recharge/easy-recharge-action-modal.vue
 */
export function confirmEasyRechargeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playereasyrecharge/confirm/', data);
}

/**
 * 拒绝银行快捷充值订单
 * @param id 充值订单 Id
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/bank-fast-recharge.vue
 * @see components/easy-recharge/easy-recharge-action-modal.vue
 */
export function rejectEasyRechargeApi(id: number | string) {
  return requestClient.put(`/backend/playereasyrecharge/denied/${id}`);
}

/**
 * 复议/复审银行快捷充值订单
 * @param data 复议参数（订单 Id 及复议说明）
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/bank-fast-recharge.vue
 * @see components/easy-recharge/easy-recharge-action-modal.vue
 */
export function reviewEasyRechargeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playereasyrecharge/reconsideration/',
    data,
  );
}

/**
 * 更新银行快捷充值凭证图片
 * @param data 图片参数（GameOrderId、Id、ImageUrl）
 * @returns 接口操作结果
 * @see components/easy-recharge/easy-recharge-voucher-cell.vue
 */
export function updateEasyRechargeImageApi(data: {
  GameOrderId: string;
  Id: number | string;
  ImageUrl: string;
}) {
  return requestClient.post('/backend/playereasyrecharge/image', data);
}

/**
 * 查询 USDT 快捷充值订单列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns USDT 充值订单列表 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/rechargeList/components/usdt-fast-recharge.vue
 */
export function fetchUsdtRechargeListApi(query: Record<string, unknown>) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: EasyRechargeListTotal;
    }
  >('/backend/playerusdteasyrecharge/list', {
    params: trimSpace(query),
  });
}

/**
 * 确认 USDT 快捷充值订单
 * @param data 确认参数（订单 Id 及审核信息）
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/usdt-fast-recharge.vue
 * @see views/operationalManage/rechargeList/components/usdt-recharge-action-modal.vue
 */
export function confirmUsdtRechargeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerusdteasyrecharge/confirm', data);
}

/**
 * 复议/复审 USDT 快捷充值订单
 * @param data 复议参数（订单 Id 及复议说明）
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/usdt-fast-recharge.vue
 * @see views/operationalManage/rechargeList/components/usdt-recharge-action-modal.vue
 */
export function reviewUsdtRechargeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playerusdteasyrecharge/reconsideration',
    data,
  );
}

/**
 * 拒绝 USDT 快捷充值订单
 * @param id 充值订单 Id
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/usdt-fast-recharge.vue
 * @see views/operationalManage/rechargeList/components/usdt-recharge-action-modal.vue
 */
export function rejectUsdtRechargeApi(id: number | string) {
  return requestClient.put(`/backend/playerusdteasyrecharge/denied/${id}`);
}

/**
 * 更新 USDT 快捷充值凭证图片
 * @param data 图片参数（订单 Id、ImageUrl 等）
 * @returns 接口操作结果
 * @see views/operationalManage/rechargeList/components/usdt-fast-recharge.vue
 */
export function updateUsdtRechargeImageApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerusdteasyrecharge/image', data);
}
