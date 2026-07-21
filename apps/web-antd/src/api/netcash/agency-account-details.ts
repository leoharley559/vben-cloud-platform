import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Row = Record<string, unknown>;
type Id = number | string;

/** 修改代理手机号提交载荷 */
export interface AgentMobilePayload {
  /** 代理 Id */
  Id: Id;
  /** 手机号 */
  Mobile: string;
}

/** 代理上下分 / 调账金额提交载荷 */
export interface AgentMoneyPayload {
  /** 代理管理员 Id */
  AdminId: Id;
  /** 金额（单位与后端约定一致，通常为分） */
  Money: number;
}

/**
 * 代理提现账户新增/编辑提交载荷
 *
 * 用于详情页提现账户相关写操作。
 */
export interface AgentWithdrawAccountPayload extends Row {
  /** 提现账号 */
  Account: string;
  /** 代理管理员 Id */
  AdminId: Id;
  /** 银行编码（银行卡类） */
  BankCode?: string;
  /** 数字货币类型（虚拟币类） */
  DigitalType?: string;
  /** 账户记录 Id；新建时可空 */
  Id?: Id;
  /** 账户名称/别名 */
  Name?: string;
  /** 真实姓名 */
  RealName?: string;
  /** 账户类型（银行卡 / 虚拟币等） */
  Type: number;
  /** 验证码 */
  ValidCode: string;
}

/**
 * 将列表接口原始响应归一为 NetcashListResult。
 *
 * 兼容：直接返回数组、`null`/非对象、或缺 Items/Pagination/Total 的对象。
 *
 * @param result 接口原始响应（列表结构、数组或空）
 * @returns 统一后的 Items / Pagination / Total
 */
function normalizeList<T extends Row = Row>(
  result?: NetcashListResult<T> | null | T[],
): NetcashListResult<T> {
  if (Array.isArray(result)) {
    return {
      Items: result,
      Pagination: { MaxCount: result.length },
      Total: {},
    };
  }
  if (!result || typeof result !== 'object') {
    return { Items: [], Pagination: { MaxCount: 0 }, Total: {} };
  }
  return {
    ...result,
    Items: Array.isArray(result.Items) ? result.Items : [],
    Pagination:
      result.Pagination && typeof result.Pagination === 'object'
        ? result.Pagination
        : { MaxCount: 0 },
    Total:
      result.Total && typeof result.Total === 'object' ? result.Total : {},
  };
}

/**
 * 通用列表 GET：请求后经 `normalizeList` 归一化。
 *
 * 本文件内登录信息、关联关系、直属代理等 Tab 列表共用。
 *
 * @param url 后端列表接口路径
 * @param query 查询参数（会 trim 空格）
 * @returns 归一化后的 NetcashListResult
 */
async function getList(
  url: string,
  query: NetcashListQuery | Record<string, unknown>,
) {
  const result = await requestClient.get<NetcashListResult | null | Row[]>(url, {
    params: trimSpace(query),
  });
  return normalizeList(result);
}

/**
 * 代理账号详情（「代理账号详情」页头部基础信息）。
 *
 * @param id 代理 AdminId
 * @returns 代理详情对象；无效响应时返回 `{}`
 * @see views/netcash/agencyAccountDetails/index.vue
 */
export async function fetchAgentNetcashDetailApi(id: Id) {
  const result = await requestClient.get<null | Row>(
    `/backend/agentnetcash/${id}`,
  );
  return result && typeof result === 'object' && !Array.isArray(result)
    ? result
    : {};
}

/**
 * 代理登录信息列表（详情页「登录信息」Tab）。
 *
 * @param query 查询参数（AdminId、时间、分页等）
 * @returns 登录记录 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-login-panel.vue
 */
export function fetchLoginInfoListApi(query: NetcashListQuery) {
  return getList('/backend/accountlogininfo/list', query);
}

/**
 * 代理登录 IP 列表（详情页「登录信息」Tab IP 子表）。
 *
 * @param query 查询参数（AdminId、时间、分页等）
 * @returns 登录 IP 记录 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-login-panel.vue
 */
export function fetchLoginIpListApi(query: NetcashListQuery) {
  return getList('/backend/accountloginip/list', query);
}

/**
 * 代理关联设备/IP 汇总列表（详情页「关联关系」Tab 汇总）。
 *
 * @param query 查询参数（AdminId 等）
 * @returns 设备/IP 汇总 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-relation-panel.vue
 */
export function fetchRelationSummaryListApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/devicesiptotal', query);
}

/**
 * 代理关联设备/IP 明细列表（详情页「关联关系」Tab 明细）。
 *
 * @param query 查询参数（AdminId 等）
 * @returns 关联明细 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-relation-panel.vue
 */
export function fetchRelationDetailListApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/devices', query);
}

/**
 * 代理提现订单列表（详情页「提现记录」Tab）。
 *
 * @param query 查询参数（AdminId、状态、时间、分页等）
 * @returns 提现订单 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-withdraw-panel.vue
 */
export function fetchWithdrawAgentListApi(query: NetcashListQuery) {
  return getList('/backend/netcashwithdraw/list', query);
}

/**
 * 代理个人统计数据（详情页「数据概览」Tab KPI）。
 *
 * @param query 查询参数（AdminId、时间范围等）
 * @returns 个人统计对象；无效响应时返回 `{}`
 * @see views/netcash/agencyAccountDetails/components/agency-data-panel.vue
 */
export function fetchAgentPersonalStatsApi(query: Record<string, unknown>) {
  return requestClient
    .get<null | Row>('/backend/agentnetcash/personalstats', {
      params: trimSpace(query),
    })
    .then((result) =>
      result && typeof result === 'object' && !Array.isArray(result)
        ? result
        : {},
    );
}

/**
 * 直属下级玩家统计列表（详情页「数据概览」Tab 玩家子表）。
 *
 * @param query 查询参数（AdminId、分页等）
 * @returns 下级玩家统计 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-data-panel.vue
 */
export function fetchAgentDirectMemberStatsApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/directlowerplayerstats', query);
}

/**
 * 直属下级代理统计列表（详情页「数据概览」Tab 代理子表）。
 *
 * @param query 查询参数（AdminId、分页等）
 * @returns 下级代理统计 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-data-panel.vue
 */
export function fetchAgentDirectAdminStatsApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/directloweradminstats', query);
}

/**
 * 修改代理绑定手机号。
 *
 * @param data Id 代理 Id；Mobile 新手机号
 * @returns 接口操作结果
 * @see views/netcash/agencyAccountDetails/index.vue
 */
export function editAgentMobileApi(data: AgentMobilePayload) {
  return requestClient.put('/backend/agentnetcash/editmobile', data);
}

/**
 * 调整代理佣金余额。
 *
 * @param data AdminId 代理 Id；Money 调整金额（正负）
 * @returns 接口操作结果
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function editAgentCommissionMoneyApi(data: AgentMoneyPayload) {
  return requestClient.put('/backend/agentnetcash/moneymodify', data);
}

/**
 * 代理提现账户列表（详情页「财务/提现账户」Tab）。
 *
 * @param adminId 代理 AdminId
 * @returns 提现账户 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export async function fetchAgentWithdrawAccountListApi(
  adminId: Id,
) {
  const result = await requestClient.get<NetcashListResult | null | Row[]>(
    `/backend/netcashwithdrawaccount/${adminId}`,
  );
  return normalizeList(result);
}

/**
 * 新增代理提现账户。
 *
 * @param data 提现账户表单 AgentWithdrawAccountPayload
 * @returns 接口操作结果
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function createAgentWithdrawAccountApi(
  data: AgentWithdrawAccountPayload,
) {
  return requestClient.post('/backend/netcashwithdrawaccount/', data);
}

/**
 * 更新代理提现账户（非银行卡类账户编辑）。
 *
 * @param data 提现账户表单 AgentWithdrawAccountPayload（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function updateAgentWithdrawAccountApi(
  data: AgentWithdrawAccountPayload,
) {
  return requestClient.put('/backend/netcashwithdrawaccount/editother', data);
}

/**
 * 删除代理提现账户。
 *
 * @param id 提现账户 Id
 * @param params 可选附加 query 参数（验证码等）
 * @returns 接口操作结果
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function deleteAgentWithdrawAccountApi(
  id: Id,
  params: Record<string, unknown> = {},
) {
  return requestClient.delete(`/backend/netcashwithdrawaccount/${id}`, {
    params,
  });
}

/**
 * 代理提现账户变更日志。
 *
 * @param adminId 代理 AdminId
 * @param withdrawTypes 提现类型
 * @returns 变更日志 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function fetchAgentWithdrawAccountLogsApi(
  adminId: Id,
  withdrawTypes: Id,
) {
  return getList('/backend/netcashwithdrawaccount/getlogs', {
    AdminId: adminId,
    WithdrawTypes: withdrawTypes,
  });
}

/**
 * 代理佣金余额调整记录。
 *
 * @param adminId 代理 AdminId
 * @returns 调整记录 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function fetchAgentMoneyModifyRecordApi(adminId: Id) {
  return getList(`/backend/agentnetcash/moneymodifyrecord/${adminId}`, {});
}

/**
 * 代理备注列表。
 *
 * @param adminId 代理 AdminId
 * @returns 备注 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/index.vue
 */
export function fetchAgentRemarkListApi(adminId: Id) {
  return getList('/backend/agentnetcash/listremark', { Id: adminId });
}

/**
 * 代理钱包余额（详情页「钱包」Tab 余额卡片）。
 *
 * @param adminId 代理 AdminId
 * @returns 钱包余额对象；无效响应时返回 `{}`
 * @see views/netcash/agencyAccountDetails/components/agency-wallet-panel.vue
 */
export async function fetchAgentWalletBalanceApi(
  adminId: Id,
): Promise<Row> {
  const result = await requestClient.get<
    null | Row | { Items?: Row }
  >('/backend/netcashaccount/accountbalance', {
    params: { AdminId: adminId },
  });
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return {};
  }
  return result.Items &&
    typeof result.Items === 'object' &&
    !Array.isArray(result.Items)
    ? (result.Items as Row)
    : result;
}

/**
 * 代理钱包流水日志（详情页「钱包」Tab 流水表）。
 *
 * @param query 查询参数（AdminId、类型、时间、分页等）
 * @returns 流水 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-wallet-panel.vue
 */
export function fetchAgentWalletLogApi(query: NetcashListQuery) {
  return getList('/backend/netcashlog/list', query);
}

/**
 * 代理佣金发放信息列表（详情页「佣金」Tab）。
 *
 * @param query 查询参数（AdminId、时间、分页等）
 * @returns 佣金信息 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function fetchAgentCommissionInfoApi(query: NetcashListQuery) {
  return getList('/backend/sendcommission/commissioninfolist', query);
}

/**
 * 代理红利发放信息列表（详情页「红利」Tab）。
 *
 * @param query 查询参数（AdminId、时间、分页等）
 * @returns 红利信息 Items 及 Pagination
 * @see views/netcash/agencyAccountDetails/components/agency-finance-panel.vue
 */
export function fetchAgentBonusInfoApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcashbonus/commbonusinfolist', query);
}
