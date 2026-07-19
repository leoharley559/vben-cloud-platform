import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  RelationQueryItem,
  RelationQueryListQuery,
  RelationQueryTotal,
} from '#/types/relation-query';
import { trimSpace } from '#/utils/string';

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

export function exportRelationQueryApi(params: Record<string, unknown>) {
  const normalized = normalizeRelationQuery(params as RelationQueryListQuery);
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/relationsearch/recordexport',
    { params: trimSpace(normalized) },
  );
}
