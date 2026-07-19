import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchJuniorMemberListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashplayerinfo/list',
    { params: trimSpace(query) },
  );
}

export function fetchJuniorMemberChangeRecordApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashplayerinfo/changerecord',
    { params: query },
  );
}

export function fetchJuniorChangeChannelListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<
    Array<Record<string, unknown>> | Record<string, unknown>
  >('/backend/agentnetcashplayerinfo/channellist', { params: query });
}

export function changeJuniorAgentApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/agentnetcashplayerinfo',
    {},
    {
      params: data,
    },
  );
}
