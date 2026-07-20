/* eslint-disable perfectionist/sort-imports */
import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export type DrawmoneyPayload = Record<string, unknown>;
export type DrawmoneyQuery = DrawmoneyPayload & Partial<NetcashListQuery>;
export type DrawmoneyRow = DrawmoneyPayload & {
  Id?: number | string;
};
export type DrawmoneyListResult = NetcashListResult<DrawmoneyRow>;

function normalizeList(result?: DrawmoneyListResult | null): DrawmoneyListResult {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

async function getList(url: string, query: DrawmoneyQuery = {}) {
  const result = await requestClient.get<DrawmoneyListResult>(url, {
    params: trimSpace(query),
  });
  return normalizeList(result);
}

export function fetchDrawmoneyListApi(query: DrawmoneyQuery) {
  return getList('/backend/netcashwithdraw/list', query);
}

export function exportDrawmoneyListApi(query: DrawmoneyQuery) {
  return requestClient.get<{
    Id?: number | string;
    Remark?: string;
    Status?: number;
  }>('/backend/netcashwithdraw/listcsv', {
    params: trimSpace(query),
  });
}

export function orderOperateApi(data: DrawmoneyPayload) {
  return requestClient.put(
    '/backend/netcashwithdraw/operate',
    {},
    {
      params: data,
    },
  );
}

export function fetchDrawmoneyBlacklistApi(query: DrawmoneyQuery) {
  return getList('/backend/netcashwithdraw/blacklist', query);
}

export function addDrawmoneyBlackApi(data: DrawmoneyPayload) {
  return requestClient.post(
    '/backend/netcashwithdraw/addblack',
    {},
    { params: data },
  );
}

export function editDrawmoneyBlackApi(data: DrawmoneyPayload) {
  return requestClient.put(
    '/backend/netcashwithdraw/editblack',
    {},
    { params: data },
  );
}

export function deleteDrawmoneyAccountApi(id: number | string) {
  return requestClient.delete(`/backend/netcashwithdraw/delblack/${id}`);
}

export async function fetchDrawingsChannelSettingListApi(
  query: DrawmoneyQuery = {},
) {
  const result = await requestClient.get<DrawmoneyRow[] | null>(
    '/backend/netcashwithdraw/managelist',
    { params: trimSpace(query) },
  );
  return Array.isArray(result) ? result : [];
}

export const drawmoneyRequest = {
  addRemark: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/addremark', {}, { params: data }),
  autoRefresh: (params: DrawmoneyPayload) =>
    requestClient.get<string>('/api/loginuser/getstatus', { params }),
  autoSettings: async (params: DrawmoneyPayload) => {
    const result = await requestClient.get<DrawmoneyPayload | null>(
      '/backend/netcashwithdraw/getswitch3',
      { params },
    );
    return result || {};
  },
  batchManual: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/editmore', data),
  batchRefuse: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/batchdenied', data),
  blacklistAdd: addDrawmoneyBlackApi,
  blacklistEdit: editDrawmoneyBlackApi,
  channelAccounts: (params: DrawmoneyPayload) =>
    getList('/backend/netcashwithdraw/agentwithdrawaccountlist', params),
  channelDetail: (Id: number | string) =>
    requestClient.get<DrawmoneyPayload>('/backend/netcashwithdraw/agentwithdrawaccountdetail', { params: { Id } }),
  channelEdit: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/thirdwithdrawtypeagentconfigedit', data),
  channelLimit: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/agentwithdrawaccountedit', data),
  channelRound: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/round', data),
  channelShelf: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/shelf', data),
  channelStatus: async (Ids: string) => {
    const result = await requestClient.get<DrawmoneyRow[] | null>(
      '/backend/netcashwithdraw/statuslist',
      { params: { Ids } },
    );
    return Array.isArray(result) ? result : [];
  },
  channelSwitch: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/switch', data),
  check: (id: number | string) =>
    requestClient.get<DrawmoneyPayload>(`/backend/netcashwithdraw/check/${id}`),
  exchangeTypes: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/exchange', data),
  listRemarks: (params: DrawmoneyPayload) =>
    getList('/backend/netcashwithdraw/listremark', params),
  manualAgree: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/manualconfirmagree', data),
  manualConfirm: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/manualconfirmhandle', data),
  manualRefuse: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/manualconfirmrefuse', data),
  saveAutoRefresh: (data: DrawmoneyPayload) =>
    requestClient.post('/api/loginuser', data),
  saveAutoSettings: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/switch3', data),
  thirdEditParams: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/editparams', data),
  thirdList: (params: DrawmoneyPayload) =>
    getList('/backend/netcashwithdraw/thirdwithdrawlist', params),
  transitionPending: (data: DrawmoneyPayload) =>
    requestClient.post('/backend/netcashwithdraw/transitionpending/', data),
  typeLimit: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/editlimit', {}, { params: data }),
  typeSwitch: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/open', {}, { params: data }),
  updateBalance: (data: DrawmoneyPayload) =>
    requestClient.put('/backend/netcashwithdraw/updateBalance', data),
  withdrawChannels: (params: DrawmoneyPayload) =>
    getList('/backend/netcashwithdraw/withdrawlist', params),
  withdrawLogs: (params: DrawmoneyPayload) =>
    getList('/backend/netcashwithdraw/withdrawlog', params),
};
