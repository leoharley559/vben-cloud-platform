import type {
  AvailableChannelQuery,
  AvailableChannelsResult,
  ChannelDetail,
  ChannelFormPayload,
  ChannelId,
  ChannelListQuery,
  ChannelListResult,
} from '#/types/channel-config';
import type {
  CloneChannelPlanPayload,
  CloneChannelPlanQuery,
  CloneChannelPlanResult,
  LogoGroupListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 代理渠道列表；保留 MoreItems，供编辑落地页时回显旧资源。 */
export async function fetchMoneyChannelListApi(query: ChannelListQuery) {
  const result = await requestClient.get<ChannelListResult | null>(
    '/backend/channel/list',
    {
      params: trimSpace({ ChannelType: 2, ...query }),
    },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    MoreItems: {
      ...result?.MoreItems,
      Parents: result?.MoreItems?.Parents ?? [],
      Resources: result?.MoreItems?.Resources ?? [],
    },
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}

export async function fetchCloneChannelPlanListApi(
  query: CloneChannelPlanQuery,
) {
  const result = await requestClient.get<CloneChannelPlanResult | null>(
    '/backend/clonechannelplan/list',
    { params: trimSpace(query) },
  );
  return { ...result, Items: result?.Items ?? [] };
}

export function addCloneChannelPlanApi(data: CloneChannelPlanPayload) {
  return requestClient.post('/backend/clonechannelplan/add/', data);
}

export function editCloneChannelPlanApi(data: CloneChannelPlanPayload) {
  return requestClient.put('/backend/clonechannelplan/edit/', data);
}

export function deleteCloneChannelPlanApi(Id: ChannelId) {
  return requestClient.delete('/backend/clonechannelplan/delete/', {
    params: { Id },
  });
}

export async function fetchAvailableMoneyChannelsApi(
  query: AvailableChannelQuery,
) {
  const result = await requestClient.get<AvailableChannelsResult | null>(
    '/backend/channel/availablechannels',
    { params: query },
  );
  return {
    ...result,
    Item: result?.Item ?? result?.Items ?? [],
  };
}

export async function fetchMoneyChannelDetailApi(id: ChannelId) {
  const result = await requestClient.get<ChannelDetail | null>(
    `/backend/channel/${id}`,
  );
  return result ?? {};
}

export function createMoneyChannelApi(data: ChannelFormPayload) {
  return requestClient.post<ChannelDetail>('/backend/channel/', data);
}

export function updateMoneyChannelApi(data: ChannelFormPayload) {
  return requestClient.put<ChannelDetail>('/backend/channel/', data);
}

export function updateMoneyChannelPrecautionApi(data: ChannelFormPayload) {
  return requestClient.put('/backend/channel/precautionactive', data);
}

export async function fetchChannelLogoGroupsApi(ChannelId: ChannelId) {
  const result = await requestClient.get<LogoGroupListResult | null>(
    '/backend/gameadtemplate/getcustomlogo',
    { params: { ChannelId } },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    PackageLogo: result?.PackageLogo ?? null,
  };
}
