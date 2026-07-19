import { requestClient } from '#/api/request';

export interface PageResult<T = Record<string, unknown>> {
  Items: T[];
  Pagination: { MaxCount?: number; [key: string]: unknown };
  [key: string]: unknown;
}

function pageResult<T>(
  data: Partial<PageResult<T>> | undefined,
): PageResult<T> {
  return {
    ...data,
    Items: data?.Items ?? [],
    Pagination: data?.Pagination ?? {},
  };
}

export function fetchWithdrawGameConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawgameconfig',
  );
}

export function updateWithdrawGameConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawgameconfig', data);
}

export function updateWithdrawTimesApi(data: {
  MaxWithdrawInTimeCount: number;
}) {
  return requestClient.put('/backend/withdrawconfig/withdrawtimes', data);
}

export function fetchWithdrawTipConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawtipconfig',
  );
}

export function updateWithdrawTipConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig', data);
}

export async function fetchWithdrawCustomTipsApi(
  query: Record<string, unknown>,
) {
  return pageResult(
    await requestClient.get<PageResult>('/backend/withdrawtip/list', {
      params: query,
    }),
  );
}

export function createWithdrawCustomTipApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawtip/', data);
}

export function updateWithdrawCustomTipApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtip/', data);
}

export function deleteWithdrawCustomTipApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawtip/${id}`);
}

export function sortWithdrawCustomTipsApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/withdrawtip/switchsequence', undefined, {
    params: data,
  });
}

export function fetchWithdrawFirstConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawtipconfig/getfirstconfig',
  );
}

export function updateWithdrawFirstConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig/editfirstconfig', data);
}

export async function fetchWithdrawPackageRulesApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<PageResult>(
    '/backend/withdrawwalletbindingconfig/list',
    { params: query },
  );
  return pageResult(result);
}

export function addWithdrawPackageRuleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawwalletbindingconfig/add', data);
}

export function deleteWithdrawPackageRuleApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/withdrawwalletbindingconfig/delete',
    data,
  );
}

export function switchWithdrawWalletApi(SwitchWallet: number) {
  return requestClient.put(
    '/backend/withdrawwalletbindingconfig/switchwallet',
    undefined,
    { params: { SwitchWallet } },
  );
}

export function fetchPlayerBindCardConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbindcardconfig',
  );
}

export function updatePlayerBindCardConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerbindcardconfig/edit', data);
}

export function resetPlayerBindCardCountApi() {
  return requestClient.put('/backend/playerbindcardconfig/reset');
}

export async function fetchBindCardIgnorePlayersApi(
  query: Record<string, unknown>,
) {
  return pageResult(
    await requestClient.get<PageResult>(
      '/backend/playerbindcardconfig/getignoreplayers',
      { params: query },
    ),
  );
}

export function addBindCardIgnorePlayerApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerbindcardconfig/addignoreplayer',
    data,
  );
}

export function deleteBindCardIgnorePlayerApi(Id: number | string) {
  return requestClient.post('/backend/playerbindcardconfig/delignoreplayer', {
    Id,
  });
}

export function fetchUsdtWithdrawRateApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentwithdrawconfig/getusdtrate',
  );
}

export function updateUsdtWithdrawRateApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentwithdrawconfig/setusdtrate', data);
}

export async function fetchVirtualWithdrawWhitelistApi(
  query: Record<string, unknown>,
) {
  return pageResult(
    await requestClient.get<PageResult>(
      '/backend/withdrawtipconfig/whitelist/',
      { params: query },
    ),
  );
}

export function addVirtualWithdrawWhitelistApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawtipconfig/addwhitelist', data);
}

export function checkVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/withdrawtipconfig/checkwhitelist',
    data,
  );
}

export function multiAddVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/withdrawtipconfig/multiaddwhitelist',
    data,
  );
}

export function deleteVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/withdrawtipconfig/delwhitelist', data);
}

export function fetchPlayerQuotaListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/withdrawtipconfig/playerquotalist',
  );
}

export function updatePlayerQuotaApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig/playerquotaedit', data);
}

export function deletePlayerQuotaApi(id: number | string) {
  return requestClient.delete(
    `/backend/withdrawtipconfig/playerquotadelete/${id}`,
  );
}

export async function fetchPlayerLevelsForWithdrawApi() {
  const result = await requestClient.get<PageResult>(
    '/backend/playerlevel/list',
    { params: { Page: 1, PageSize: 999 } },
  );
  return pageResult(result);
}

export function fetchWithdrawEstimatedTimeApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawestimatedtimeconfig',
  );
}

export function updateWithdrawEstimatedTimeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawestimatedtimeconfig', data);
}
