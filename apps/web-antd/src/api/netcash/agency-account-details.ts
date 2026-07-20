import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Row = Record<string, unknown>;
type Id = number | string;

export interface AgentMobilePayload {
  Id: Id;
  Mobile: string;
}

export interface AgentMoneyPayload {
  AdminId: Id;
  Money: number;
}

export interface AgentWithdrawAccountPayload extends Row {
  Account: string;
  AdminId: Id;
  BankCode?: string;
  DigitalType?: string;
  Id?: Id;
  Name?: string;
  RealName?: string;
  Type: number;
  ValidCode: string;
}

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

async function getList(
  url: string,
  query: NetcashListQuery | Record<string, unknown>,
) {
  const result = await requestClient.get<NetcashListResult | null | Row[]>(url, {
    params: trimSpace(query),
  });
  return normalizeList(result);
}

export async function fetchAgentNetcashDetailApi(id: Id) {
  const result = await requestClient.get<null | Row>(
    `/backend/agentnetcash/${id}`,
  );
  return result && typeof result === 'object' && !Array.isArray(result)
    ? result
    : {};
}

export function fetchLoginInfoListApi(query: NetcashListQuery) {
  return getList('/backend/accountlogininfo/list', query);
}

export function fetchLoginIpListApi(query: NetcashListQuery) {
  return getList('/backend/accountloginip/list', query);
}

export function fetchRelationSummaryListApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/devicesiptotal', query);
}

export function fetchRelationDetailListApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/devices', query);
}

export function fetchWithdrawAgentListApi(query: NetcashListQuery) {
  return getList('/backend/netcashwithdraw/list', query);
}

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

export function fetchAgentDirectMemberStatsApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/directlowerplayerstats', query);
}

export function fetchAgentDirectAdminStatsApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcash/directloweradminstats', query);
}

export function editAgentMobileApi(data: AgentMobilePayload) {
  return requestClient.put('/backend/agentnetcash/editmobile', data);
}

export function editAgentCommissionMoneyApi(data: AgentMoneyPayload) {
  return requestClient.put('/backend/agentnetcash/moneymodify', data);
}

export async function fetchAgentWithdrawAccountListApi(
  adminId: Id,
) {
  const result = await requestClient.get<NetcashListResult | null | Row[]>(
    `/backend/netcashwithdrawaccount/${adminId}`,
  );
  return normalizeList(result);
}

export function createAgentWithdrawAccountApi(
  data: AgentWithdrawAccountPayload,
) {
  return requestClient.post('/backend/netcashwithdrawaccount/', data);
}

export function updateAgentWithdrawAccountApi(
  data: AgentWithdrawAccountPayload,
) {
  return requestClient.put('/backend/netcashwithdrawaccount/editother', data);
}

export function deleteAgentWithdrawAccountApi(
  id: Id,
  params: Record<string, unknown> = {},
) {
  return requestClient.delete(`/backend/netcashwithdrawaccount/${id}`, {
    params,
  });
}

export function fetchAgentWithdrawAccountLogsApi(
  adminId: Id,
  withdrawTypes: Id,
) {
  return getList('/backend/netcashwithdrawaccount/getlogs', {
    AdminId: adminId,
    WithdrawTypes: withdrawTypes,
  });
}

export function fetchAgentMoneyModifyRecordApi(adminId: Id) {
  return getList(`/backend/agentnetcash/moneymodifyrecord/${adminId}`, {});
}

export function fetchAgentRemarkListApi(adminId: Id) {
  return getList('/backend/agentnetcash/listremark', { Id: adminId });
}

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

export function fetchAgentWalletLogApi(query: NetcashListQuery) {
  return getList('/backend/netcashlog/list', query);
}

export function fetchAgentCommissionInfoApi(query: NetcashListQuery) {
  return getList('/backend/sendcommission/commissioninfolist', query);
}

export function fetchAgentBonusInfoApi(query: NetcashListQuery) {
  return getList('/backend/agentnetcashbonus/commbonusinfolist', query);
}
