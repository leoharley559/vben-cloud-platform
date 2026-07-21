import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

/**
 * 充兑差报表列表（充兑差页）
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/depositWithdrawalDiff/index.vue
 */
export function fetchDepositWithdrawalDiffListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/sgdeposit/DepositWithdrawalReport', { params: trimSpace(query) })
    .then(toListResult);
}

/**
 * 用户地区分布 - 充值（分布页「充值」Tab）
 *
 * 同一接口 `/backend/operation/userarea` 的 `pay` 字段，包装为列表结构。
 *
 * @param query 日期、地区等筛选参数
 * @returns 标准列表结构 Items（取自 pay 数组）+ Pagination
 * @see views/dataClose/distribution/index.vue
 */
export async function fetchDistributionPayListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ pay?: Record<string, unknown>[] }>(
    '/backend/operation/userarea',
    { params: trimSpace(query) },
  );
  const items = data.pay || [];
  return toListResult({}, items);
}

/**
 * 用户地区分布 - 注册（分布页「注册」Tab）
 *
 * 同一接口 `/backend/operation/userarea` 的 `reg` 字段，包装为列表结构。
 *
 * @param query 日期、地区等筛选参数
 * @returns 标准列表结构 Items（取自 reg 数组）+ Pagination
 * @see views/dataClose/distribution/index.vue
 */
export async function fetchDistributionRegListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ reg?: Record<string, unknown>[] }>(
    '/backend/operation/userarea',
    { params: trimSpace(query) },
  );
  const items = data.reg || [];
  return toListResult({}, items);
}
