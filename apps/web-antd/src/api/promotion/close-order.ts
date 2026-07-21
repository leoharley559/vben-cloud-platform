import type {
  CloseOrderFinishPayload,
  CloseOrderListQuery,
  CloseOrderListResult,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取结算订单列表
 * @param query 分页与筛选条件
 * @returns 结算订单列表、汇总及分页信息
 * @see views/generalizeManage/closeOrder/index.vue
 */
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

/**
 * 开始处理结算订单
 * @param data 含订单 ID 的操作参数
 * @returns 处理结果
 * @see views/generalizeManage/closeOrder/index.vue
 */
export function startCloseOrderApi(data: { Id?: number | string }) {
  return requestClient.post('/backend/accountteamwithdrawapply/applydo', data);
}

/**
 * 完成结算订单
 * @param data 完成结算的表单数据
 * @returns 完成结果
 * @see views/generalizeManage/closeOrder/components/finish-order-modal.vue
 */
export function finishCloseOrderApi(data: CloseOrderFinishPayload) {
  return requestClient.post(
    '/backend/accountteamwithdrawapply/applyfinish',
    data,
  );
}
