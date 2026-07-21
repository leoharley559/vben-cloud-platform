import type {
  SpillManageAuditPayload,
  SpillManageItem,
  SpillManageListQuery,
  SpillManageListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type SpillManageRawResult = {
  Items?: null | SpillManageItem[];
  Pagination?: null | {
    MaxCount?: number;
    Page?: number;
    PageSize?: number;
  };
  Total?: null | number | string;
};

/**
 * 溢出玩家管理列表（净现金「溢出管理」页主表格）。
 *
 * @param query 查询参数（代理、玩家、审核状态、时间等）
 * @returns 溢出申请行 Items 及 Pagination / Total
 * @see views/netcash/spillManage/index.vue
 */
export async function fetchSpillManageListApi(
  query: SpillManageListQuery,
): Promise<SpillManageListResult> {
  const result = await requestClient.get<null | SpillManageRawResult>(
    '/backend/agentplayermanage/list',
    { params: trimSpace(query) },
  );
  const items = Array.isArray(result?.Items) ? result.Items : [];
  const total = Number(
    result?.Total ?? result?.Pagination?.MaxCount ?? items.length,
  );
  return {
    Items: items,
    Pagination: {
      ...result?.Pagination,
      MaxCount: Number.isFinite(total) ? total : 0,
    },
    Total: Number.isFinite(total) ? total : 0,
  };
}

/**
 * 审核溢出玩家申请（通过/拒绝等操作）。
 *
 * @param data 审核载荷（记录 Id、操作类型、备注等）
 * @returns 接口操作结果
 * @see views/netcash/spillManage/index.vue
 */
export function auditSpillManageApi(data: SpillManageAuditPayload) {
  return requestClient.put('/backend/agentplayermanage/operate', data);
}
