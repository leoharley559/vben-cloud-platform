import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  RelationQueryItem,
  RelationQueryListQuery,
  RelationQueryTotal,
} from '#/types/relation-query';
import { trimSpace } from '#/utils/string';

/**
 * 规范化关联查询列表参数。
 *
 * 去除首尾空格，并将 ChannelIds、ChannelSearch 多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeRelationQuery(query: RelationQueryListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }
  const channelSearch = params.ChannelSearch;
  if (Array.isArray(channelSearch)) {
    params.ChannelSearch = channelSearch.length ? channelSearch.join(',') : '';
  }
  return params;
}

/**
 * 分页查询关联查询结果（同 IP/设备/玩家关联）。
 *
 * @param query 关联类型、渠道、时间等筛选及分页参数
 * @returns Items、Pagination 及 Total 汇总（设备数/IP 数/玩家数）
 * @see views/operationalManage/relationQuery/index.vue
 */
export async function fetchRelationQueryListApi(query: RelationQueryListQuery) {
  const result = await requestClient.get<
    CloudListResult<RelationQueryItem> & { Total?: RelationQueryTotal }
  >('/backend/relationsearch/list', {
    params: normalizeRelationQuery(query),
  });
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
    Total: result?.Total || {
      DeviceIdCount: 0,
      IpCount: 0,
      PlayerCount: 0,
    },
  };
}

/**
 * 导出关联查询记录 CSV。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/relationQuery/index.vue
 */
export function exportRelationQueryApi(params: Record<string, unknown>) {
  const normalized = normalizeRelationQuery(params as RelationQueryListQuery);
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/relationsearch/recordexport',
    { params: trimSpace(normalized) },
  );
}
