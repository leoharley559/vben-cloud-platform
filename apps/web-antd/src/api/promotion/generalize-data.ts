import type { InvalidUserSummary } from '#/types/generalize-data';

import { requestClient } from '#/api/request';
import { toPromotionListResult } from '#/types/generalize-data';
import { trimSpace } from '#/utils/string';

/**
 * 获取渠道数据列表（推广数据页）
 * @param query 分页与筛选条件
 * @returns 标准化后的渠道数据列表及分页信息
 * @see views/generalizeData/channelDatas/index.vue
 */
export async function fetchChannelDatasListApi(query: Record<string, unknown>) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/promotedata/channelreport', { params: trimSpace(query) });
  return toPromotionListResult(data);
}

/**
 * 获取渠道回本成本数据列表
 * @param query 分页与筛选条件
 * @returns 标准化后的渠道回本成本列表及分页信息
 * @see views/generalizeData/channelRecoupCostsData/index.vue
 */
export async function fetchChannelRecoupCostsListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/operation/channelbreakevenreport', { params: trimSpace(query) });
  return toPromotionListResult(data);
}

/**
 * 获取数据录入列表
 * @param query 分页与筛选条件
 * @returns 标准化后的数据录入列表及分页信息
 * @see views/generalizeData/dataWrite/index.vue
 */
export function fetchDataWriteListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/handrecord/list', { params: trimSpace(query) })
    .then(toPromotionListResult);
}

/**
 * 获取掉量变更数据列表（推广数据页）
 * @param query 分页与筛选条件
 * @returns 标准化后的掉量变更列表及分页信息
 * @see views/generalizeData/dropChange/index.vue
 */
export async function fetchDropChangeListApi(query: Record<string, unknown>) {
  const data = await requestClient.get<{
    Item?: Record<string, unknown>[];
    Page?: { MaxCount?: number };
  }>('/backend/promotedata/getsumrecord', { params: trimSpace(query) });
  const items = data.Item || [];
  return toPromotionListResult(
    { Pagination: { MaxCount: data.Page?.MaxCount } },
    items,
  );
}

/**
 * 获取无效用户汇总数据
 * @param query 日期与渠道筛选条件
 * @returns 无效用户汇总统计
 * @see views/generalizeData/invalidUser/index.vue
 */
export function fetchInvalidUserSummaryApi(query: Record<string, unknown>) {
  return requestClient.get<{ Items?: InvalidUserSummary }>(
    '/backend/promotedata/invaliduser',
    { params: trimSpace(query) },
  );
}
