import type {
  BonusAdminItem,
  BonusBatchResult,
  BonusManageItem,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';

/**
 * 红利列表空结果占位。
 *
 * 接口返回 `null`/非对象时，保证 Items、Pagination、Total 结构完整。
 *
 * @returns 空 Items，Pagination.MaxCount 为 0，Total 含 Total/TotalReal 默认值
 */
function emptyListResult(): NetcashListResult<BonusManageItem> {
  return {
    Items: [],
    Pagination: { MaxCount: 0 },
    Total: { Total: 0, TotalReal: 0 },
  };
}

/**
 * 将红利列表接口响应归一为 NetcashListResult。
 *
 * 兼容缺 Items/Pagination/Total 或整段为空的情况。
 *
 * @param result 接口原始响应
 * @returns 归一化后的 Items、Pagination 及 Total（无效时回退 {@link emptyListResult}）
 */
function normalizeListResult(
  result?: NetcashListResult<BonusManageItem> | null,
) {
  if (!result || typeof result !== 'object') {
    return emptyListResult();
  }
  return {
    ...result,
    Items: Array.isArray(result.Items) ? result.Items : [],
    Pagination: result.Pagination || { MaxCount: 0 },
    Total: result.Total || { Total: 0, TotalReal: 0 },
  };
}

/**
 * 代理红利发放历史列表（「红利管理」页历史记录 Tab）。
 *
 * @param query 查询参数（代理、时间、状态、分页等）
 * @returns 红利记录 Items、Pagination 及 Total 汇总
 * @see views/netcash/bonusManage/index.vue
 */
export async function fetchBonusHistoryListApi(query: NetcashListQuery) {
  const result =
    await requestClient.get<NetcashListResult<BonusManageItem> | null>(
      '/backend/agentnetcashbonus/list',
      { params: query },
    );
  return normalizeListResult(result);
}

/**
 * 待审批红利列表（「红利管理」页审批 Tab）。
 *
 * @param query 查询参数（代理、时间、分页等）
 * @returns 待审批红利 Items、Pagination 及 Total
 * @see views/netcash/bonusManage/index.vue
 */
export async function fetchBonusApproveListApi(query: NetcashListQuery) {
  const result =
    await requestClient.get<NetcashListResult<BonusManageItem> | null>(
      '/backend/agentnetcashbonus/approvelist',
      {
        params: query,
      },
    );
  return normalizeListResult(result);
}

/**
 * 审批代理红利申请（通过/拒绝）。
 *
 * @param data 审批载荷（记录 Id、Approve 等）
 * @returns 接口操作结果
 * @see views/netcash/bonusManage/index.vue
 */
export function approveBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus/approve', data);
}

/**
 * 单笔发放代理红利。
 *
 * @param data 发放表单（AdminId、金额、备注等）
 * @returns 接口操作结果
 * @see views/netcash/bonusManage/index.vue
 */
export function provideBonusApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashbonus', data);
}

/**
 * 批量发放代理红利。
 *
 * @param data 批量发放表单（多条 AdminId / 金额等）
 * @returns 批量结果（成功/失败明细）；空响应时返回 `{}`
 * @see views/netcash/bonusManage/index.vue
 */
export async function batchProvideBonusApi(data: Record<string, unknown>) {
  const result = await requestClient.post<BonusBatchResult | null>(
    '/backend/agentnetcashbonus/batch',
    data,
  );
  return result && typeof result === 'object' ? result : {};
}

/**
 * 按条件查询可发放红利的代理 AdminId。
 *
 * @param data 查询条件（账号、渠道等）
 * @returns `{ Items: BonusAdminItem[] }` 可发放代理列表
 * @see views/netcash/bonusManage/index.vue
 */
export async function queryBonusAdminIdApi(data: Record<string, unknown>) {
  const result = await requestClient.post<
    BonusAdminItem[] | null | { Items?: BonusAdminItem[] }
  >('/backend/agentnetcashbonus/queryadminid', data);
  if (Array.isArray(result)) {
    return { Items: result };
  }
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
  };
}

/**
 * 调整已发放红利金额或备注。
 *
 * @param data 调整载荷（含记录 Id 及新值）
 * @returns 接口操作结果
 * @see views/netcash/bonusManage/index.vue
 */
export function adjustBonusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashbonus', data);
}
