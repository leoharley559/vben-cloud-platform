import type { CloudListResult } from '#/types/operational-data';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将无限代理接口响应归一为 CloudListResult。
 *
 * Items 缺省时为 `[]`；Pagination.MaxCount 优先取接口值，否则用 Items 长度。
 *
 * @param data 接口原始响应（Items、Pagination）
 * @returns 含 Items 及 Pagination.MaxCount 的列表结构
 */
function toListResult(data: {
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
}) {
  const items = data.Items || [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

/**
 * 获取无限代理层级查询列表（多层级汇总）。
 * @param query 查询参数（日期范围、包体筛选等）
 * @returns Items 无限代理层级行，Pagination.MaxCount 为条目数
 * @see views/operationalData/endlessAgent/index.vue
 */
export async function fetchEndlessAgentMultipleListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/list', { params: trimSpace(query) });
  return toListResult(data);
}

/**
 * 获取无限代理按时间维度查询列表。
 * @param query 查询参数（日期范围、包体筛选等）
 * @returns Items 按时间聚合的无限代理行，Pagination.MaxCount 为条目数
 * @see views/operationalData/endlessAgent/index.vue
 */
export async function fetchEndlessAgentByTimeListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/listtime', { params: trimSpace(query) });
  return toListResult(data);
}

/**
 * 获取无限代理按用户明细查询列表。
 * @param query 查询参数（日期范围、用户/代理筛选等）
 * @returns Items 用户维度无限代理明细行，Pagination.MaxCount 为条目数
 * @see views/operationalData/endlessAgent/index.vue
 */
export async function fetchEndlessAgentByUserListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/listdetails', { params: query });
  return toListResult(data);
}

/**
 * 获取无限代理渠道报表列表。
 * @param query 查询参数（日期范围、渠道筛选等）
 * @returns Items 无限代理渠道报表行，Pagination.MaxCount 为条目数
 */
export async function fetchEndlessChannelReportApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/operation/unlimitedchannelreport', { params: query });
  return toListResult(data);
}
