/* eslint-disable perfectionist/sort-imports */
import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

/** 提现模块通用请求/操作载荷 */
export type DrawmoneyPayload = Record<string, unknown>;
/** 提现列表查询参数（含分页与筛选） */
export type DrawmoneyQuery = DrawmoneyPayload & Partial<NetcashListQuery>;
/** 提现列表单行数据 */
export type DrawmoneyRow = DrawmoneyPayload & {
  /** 记录 Id */
  Id?: number | string;
};
/** 提现列表响应结构 */
export type DrawmoneyListResult = NetcashListResult<DrawmoneyRow>;

/**
 * 将提现列表响应归一为 DrawmoneyListResult。
 *
 * 保留响应中的其他字段，并确保 Items/Pagination/Total 可用。
 *
 * @param result 接口原始响应
 * @returns 归一化后的提现列表结构
 */
function normalizeList(result?: DrawmoneyListResult | null): DrawmoneyListResult {
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

/**
 * 提现模块通用列表 GET：请求后经 `normalizeList` 归一化。
 *
 * @param url 后端列表接口路径
 * @param query 查询参数（会 trim 空格，默认 `{}`）
 * @returns 归一化后的 DrawmoneyListResult
 */
async function getList(url: string, query: DrawmoneyQuery = {}) {
  const result = await requestClient.get<DrawmoneyListResult>(url, {
    params: trimSpace(query),
  });
  return normalizeList(result);
}

/**
 * 代理提现订单列表（「提现管理」页主表格）。
 *
 * @param query 查询参数（状态、时间、代理、分页等）
 * @returns 提现订单 Items 及 Pagination
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function fetchDrawmoneyListApi(query: DrawmoneyQuery) {
  return getList('/backend/netcashwithdraw/list', query);
}

/**
 * 导出提现订单 CSV（异步导出任务）。
 *
 * @param query 与列表相同的筛选条件
 * @returns 导出任务信息（Id、Status、Remark 等）
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function exportDrawmoneyListApi(query: DrawmoneyQuery) {
  return requestClient.get<{
    Id?: number | string;
    Remark?: string;
    Status?: number;
  }>('/backend/netcashwithdraw/listcsv', {
    params: trimSpace(query),
  });
}

/**
 * 提现订单操作（同意/拒绝/挂起等）。
 *
 * @param data 操作载荷（订单 Id、Operate 类型等，经 query params 提交）
 * @returns 接口操作结果
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function orderOperateApi(data: DrawmoneyPayload) {
  return requestClient.put(
    '/backend/netcashwithdraw/operate',
    {},
    {
      params: data,
    },
  );
}

/**
 * 提现黑名单列表（「提现管理」页黑名单 Tab）。
 *
 * @param query 查询参数（账号、分页等）
 * @returns 黑名单 Items 及 Pagination
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function fetchDrawmoneyBlacklistApi(query: DrawmoneyQuery) {
  return getList('/backend/netcashwithdraw/blacklist', query);
}

/**
 * 新增提现黑名单条目。
 *
 * @param data 黑名单表单（账号、原因等，经 query params 提交）
 * @returns 接口操作结果
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function addDrawmoneyBlackApi(data: DrawmoneyPayload) {
  return requestClient.post(
    '/backend/netcashwithdraw/addblack',
    {},
    { params: data },
  );
}

/**
 * 编辑提现黑名单条目。
 *
 * @param data 黑名单表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function editDrawmoneyBlackApi(data: DrawmoneyPayload) {
  return requestClient.put(
    '/backend/netcashwithdraw/editblack',
    {},
    { params: data },
  );
}

/**
 * 删除提现黑名单账户。
 *
 * @param id 黑名单记录 Id
 * @returns 接口操作结果
 * @see views/netcash/drawmoneyManage/index.vue
 */
export function deleteDrawmoneyAccountApi(id: number | string) {
  return requestClient.delete(`/backend/netcashwithdraw/delblack/${id}`);
}

/**
 * 提现通道设置列表（代理账号详情财务面板选择提现通道时复用）。
 *
 * @param query 查询参数（可选 AdminId 等）
 * @returns 通道设置行数组；空响应时返回 `[]`
 * @see views/netcash/drawmoneyManage/index.vue
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
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
