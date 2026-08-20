import type { CloudListResult } from '#/types/operation-manage';
import type { PlatformTransferItem } from '#/types/platform-transfer';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 分页查询场馆钱包转账订单列表。
 *
 * @param query 账号、状态、时间等筛选及分页参数
 * @returns 转账订单 Items 与 Pagination
 * @see views/operationalManage/audit/components/platform-transfer-list.vue
 * @see views/memberManage/venueChange/index.vue
 * @see views/operationalManage/playerDetails/components/player-venue-transfer.vue
 */
export async function fetchPlatformTransferListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<CloudListResult<PlatformTransferItem>>(
    '/backend/playerwallettransferorder/list',
    { params: trimSpace(query) },
  );
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 编辑场馆转账订单状态（人工处理）。
 *
 * @param data 订单 Id 及目标状态等
 * @returns 接口响应
 * @see views/operationalManage/audit/components/platform-transfer-list.vue
 * @see views/memberManage/venueChange/index.vue
 */
export function editPlatformTransferStateApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwallettransferorder/editstate',
    data,
  );
}

/**
 * 手动发起场馆钱包转账。
 *
 * @param data 玩家、源/目标场馆及金额等
 * @returns 接口响应
 * @see views/operationalManage/audit/components/platform-transfer-list.vue
 * @see views/memberManage/venueChange/index.vue
 */
export function manualPlatformTransferApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwallettransferorder/manual', data);
}
