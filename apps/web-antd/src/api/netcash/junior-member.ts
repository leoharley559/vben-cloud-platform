import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface JuniorMemberListResult extends NetcashListResult {
  Pagination: NonNullable<NetcashListResult['Pagination']>;
  Total: Record<string, number>;
}

function normalizeListResult(
  result?: NetcashListResult | null,
): JuniorMemberListResult {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
    Total: result?.Total || {},
  };
}

export async function fetchJuniorMemberListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashplayerinfo/list',
    { params: trimSpace(query) },
  );
  return normalizeListResult(result);
}

export async function fetchJuniorMemberChangeRecordApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/agentnetcashplayerinfo/changerecord',
    { params: trimSpace(query) },
  );
  return normalizeListResult(result);
}

export async function fetchJuniorChangeChannelListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    Array<Record<string, unknown>> | Record<string, unknown>
  >('/backend/agentnetcashplayerinfo/channellist', { params: query });
  if (Array.isArray(result)) return result;
  return Array.isArray(result?.Items) ? result.Items : [];
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

export async function fetchJuniorAlgorithmOptionsApi() {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/commissionalgorithmtemplate/list',
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

export async function fetchJuniorAgentOptionsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<null | Record<string, unknown>>(
    '/backend/channel/listallsonpromoter',
    { params: trimSpace(query) },
  );
  return Array.isArray(result?.ItemsSon)
    ? (result.ItemsSon as Record<string, unknown>[])
    : [];
}

export async function fetchJuniorAgentChannelsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<NetcashListResult | null>(
    '/backend/channel/list',
    { params: trimSpace(query) },
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

export async function validateJuniorImportApi(
  players: Array<Record<string, unknown>>,
) {
  const result = await requestClient.post<NetcashListResult | null>(
    '/backend/agentnetcash/playerinfo',
    { Players: JSON.stringify(players) },
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}

export function submitJuniorImportApi(data: {
  AdminId: number | string;
  Players: string;
}) {
  return requestClient.post('/backend/agentnetcash/addplayer', data);
}
