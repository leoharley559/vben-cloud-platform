import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchMoneyChannelListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/channel/list', {
    params: trimSpace({
      ChannelType: 2,
      IsHidden: 1,
      ...query,
    }),
  });
}

export function fetchCloneChannelPlanListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/clonechannelplan/list',
    { params: trimSpace(query) },
  );
}
