import type { ChannelDomainListResult } from '#/types/channel-config';
import type {
  AgentDomainQuery,
  AgentDomainRow,
  NetcashListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export async function fetchAgentDomainListApi(query: AgentDomainQuery) {
  const result = await requestClient.get<
    NetcashListResult<AgentDomainRow> | null
  >(
    '/backend/agentchanneldomain/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}

/** 旧接口要求提交整行，不能只发两个域名字段。 */
export function updateAgentDomainApi(data: AgentDomainRow) {
  return requestClient.put('/backend/agentchanneldomain/', data);
}

export async function fetchAssignableDomainsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<ChannelDomainListResult | null>(
    '/backend/domain/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}
