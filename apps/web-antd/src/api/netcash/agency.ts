import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  AgencyListItem,
  AgencyListQuery,
  AgencyRegisterItem,
  AgencyRegisterListQuery,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';
import { trimSpace } from '#/utils/string';

/**
 * 代理账号列表（「代理管理」页主表格）。
 *
 * @param query 查询参数（账号、状态、分页等）
 * @returns 代理行 Items、Pagination 及 Total；空 Items 时返回 `[]`
 * @see views/netcash/agency/components/agency-list.vue
 */
export async function fetchAgencyListApi(query: AgencyListQuery) {
  const result = await requestClient.get<CloudListResult<AgencyListItem> | null>(
    '/backend/agentnetcash/list',
    {
      params: trimSpace(query),
    },
  );
  return {
    ...(result || {}),
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
    Total: result?.Total || {},
  };
}

/**
 * 切换代理账号启用/停用状态。
 *
 * @param data AdminId 代理 Id；Status 目标状态；RemarkOnDeactivation 停用备注
 * @returns 接口操作结果
 * @see views/netcash/agency/components/agency-list.vue
 */
export function switchAgencyStatusApi(data: {
  AdminId: number | string;
  RemarkOnDeactivation: string;
  Status: number;
}) {
  return requestClient.put(
    '/backend/agentnetcash/switch',
    {},
    {
      params: data,
    },
  );
}

/**
 * 代理注册申请列表（「代理管理」页注册审核 Tab）。
 *
 * @param query 查询参数（审核状态、时间、分页等）
 * @returns 注册申请 Items 及 Pagination
 * @see views/netcash/agency/components/register-list.vue
 */
export function fetchAgencyRegisterListApi(query: AgencyRegisterListQuery) {
  return requestClient.get<CloudListResult<AgencyRegisterItem>>(
    '/backend/agentnetcashregister/list',
    { params: trimSpace(query) },
  );
}

/**
 * 审批代理注册申请（通过/拒绝）。
 *
 * @param data Approve 审批结果；Ids 申请 Id（可逗号分隔）
 * @returns 接口操作结果
 * @see views/netcash/agency/components/register-list.vue
 */
export function approveAgencyRegisterApi(data: {
  Approve: number;
  Ids: number | string;
}) {
  return requestClient.post('/backend/agentnetcashregister/approve', data);
}

/**
 * 切换代理注册自动审核开关。
 *
 * @param data Enable 开关值（0/1）
 * @returns 接口操作结果
 * @see views/netcash/agency/components/register-list.vue
 */
export function switchAgencyAutoAuditApi(data: { Enable: number | string }) {
  return requestClient.post('/backend/agentnetcashregister/auto', data);
}

/**
 * 国家/地区配置列表（区域屏蔽面板数据源）。
 *
 * @param query 查询参数（分页等）
 * @returns 国家配置 Items 及 Pagination
 * @see views/netcash/agency/components/areamasking-panel.vue
 */
export function fetchCountriesConfigListApi(query: Record<string, unknown>) {
  return requestClient.get<NetcashListResult>('/backend/countriesconfig/list', {
    params: query,
  });
}

/**
 * 游戏可用国家/地区配置（区域屏蔽编辑回显）。
 *
 * @param query 查询参数（GameId 等）
 * @returns 游戏国家配置对象
 * @see views/netcash/agency/components/areamasking-panel.vue
 */
export function fetchGameCountriesApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>('/backend/gamecountries/', {
    params: query,
  });
}

/**
 * 更新游戏可用国家/地区配置。
 *
 * @param data 国家配置表单
 * @returns 接口操作结果
 * @see views/netcash/agency/components/areamasking-panel.vue
 */
export function updateGameCountriesApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecountries/', data);
}

/**
 * 开发者名称列表（「代理管理」页开发者 Tab）。
 *
 * @param query 查询参数（名称、分页等）
 * @returns 开发者名称 Items 及 Pagination
 * @see views/netcash/agency/components/developer-list.vue
 */
export function fetchDeveloperNamesListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/agentnetcashdevelopername/list',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 新增开发者名称。
 *
 * @param data 开发者名称表单
 * @returns 接口操作结果
 * @see views/netcash/agency/components/developer-list.vue
 */
export function createDeveloperNameApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcashdevelopername/add', data);
}

/**
 * 编辑开发者名称。
 *
 * @param data 开发者名称表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/agency/components/developer-list.vue
 */
export function updateDeveloperNameApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcashdevelopername/edit', data);
}

/**
 * 删除开发者名称。
 *
 * @param data Id 开发者名称 Id
 * @returns 接口操作结果
 * @see views/netcash/agency/components/developer-list.vue
 */
export function deleteDeveloperNameApi(data: { Id: number | string }) {
  return requestClient.delete('/backend/agentnetcashdevelopername/delete', {
    params: data,
  });
}

/**
 * 可选代理负责人列表（新建/编辑代理时选择上级或负责人）。
 *
 * @param query 查询参数（账号、状态等）
 * @returns 代理账号 Items 及 Pagination
 * @see views/netcash/agency/components/agency-form-modal.vue
 */
export function fetchAgencyPrincipalListApi(query: Record<string, unknown>) {
  return requestClient.get<NetcashListResult>('/backend/agentnetcash/list', {
    params: trimSpace(query),
  });
}

/**
 * 新建代理账号。
 *
 * @param data 代理表单（账号、密码、佣金方案等）
 * @returns 接口操作结果
 * @see views/netcash/agency/components/agency-form-modal.vue
 */
export function createAgencyApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash', data);
}

/**
 * 更新代理账号信息。
 *
 * @param data 代理表单（含 AdminId 及待更新字段）
 * @returns 接口操作结果
 * @see views/netcash/agency/components/agency-form-modal.vue
 */
export function updateAgencyApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentnetcash', data);
}

/**
 * 为代理批量添加下级玩家。
 *
 * @param data AdminId 代理 Id；Players JSON 字符串
 * @returns 接口操作结果
 * @see views/netcash/agency/components/agency-member-modal.vue
 */
export function addAgencyPlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentnetcash/addplayer', data);
}

/**
 * 校验待添加玩家是否合法（提交前预检）。
 *
 * @param data AdminId 代理 Id；Players 玩家账号字符串
 * @returns 校验结果 Items 数组；无效时返回 `[]`
 * @see views/netcash/agency/components/agency-member-modal.vue
 */
export async function checkAgencyPlayersApi(data: {
  AdminId: number | string;
  Players: string;
}) {
  const result = await requestClient.post<NetcashListResult | null>(
    '/backend/agentnetcash/checkplayers',
    data,
  );
  return Array.isArray(result?.Items) ? result.Items : [];
}
