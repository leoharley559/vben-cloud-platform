import { requestClient } from '#/api/request';

/** 提现配置模块分页列表响应 */
export interface PageResult<T = Record<string, unknown>> {
  Items: T[];
  Pagination: { [key: string]: unknown; MaxCount?: number; };
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

/**
 * 查询提现游戏配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawGameConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawgameconfig',
  );
}

/**
 * 更新提现游戏配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawGameConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawgameconfig', data);
}

/**
 * 更新提现次数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawTimesApi(data: {
  MaxWithdrawInTimeCount: number;
}) {
  return requestClient.put('/backend/withdrawconfig/withdrawtimes', data);
}

/**
 * 查询提现提示配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawTipConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawtipconfig',
  );
}

/**
 * 更新提现提示配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawTipConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig', data);
}

/**
 * 查询提现自定义提示。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export async function fetchWithdrawCustomTipsApi(
  query: Record<string, unknown>,
) {
  return pageResult(
    await requestClient.get<PageResult>('/backend/withdrawtip/list', {
      params: query,
    }),
  );
}

/**
 * 新增提现自定义提示。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/withdrawConfig
 */
export function createWithdrawCustomTipApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawtip/', data);
}

/**
 * 更新提现自定义提示。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawCustomTipApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtip/', data);
}

/**
 * 删除提现自定义提示。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deleteWithdrawCustomTipApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawtip/${id}`);
}

/**
 * 调整提现自定义提示排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function sortWithdrawCustomTipsApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/withdrawtip/switchsequence', undefined, {
    params: data,
  });
}

/**
 * 查询提现首配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawFirstConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawtipconfig/getfirstconfig',
  );
}

/**
 * 更新提现首配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawFirstConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig/editfirstconfig', data);
}

/**
 * 查询提现包体规则。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export async function fetchWithdrawPackageRulesApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<PageResult>(
    '/backend/withdrawwalletbindingconfig/list',
    { params: query },
  );
  return pageResult(result);
}

/**
 * 添加提现包体规则。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/withdrawConfig
 */
export function addWithdrawPackageRuleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawwalletbindingconfig/add', data);
}

/**
 * 删除提现包体规则。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deleteWithdrawPackageRuleApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/withdrawwalletbindingconfig/delete',
    data,
  );
}

/**
 * 切换提现钱包。
 *
 * @param SwitchWallet 钱包绑定总开关
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function switchWithdrawWalletApi(SwitchWallet: number) {
  return requestClient.put(
    '/backend/withdrawwalletbindingconfig/switchwallet',
    undefined,
    { params: { SwitchWallet } },
  );
}

/**
 * 查询玩家绑定银行卡配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchPlayerBindCardConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbindcardconfig',
  );
}

/**
 * 更新玩家绑定银行卡配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updatePlayerBindCardConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerbindcardconfig/edit', data);
}

/**
 * 重置玩家绑定银行卡Count。
 *
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function resetPlayerBindCardCountApi() {
  return requestClient.put('/backend/playerbindcardconfig/reset');
}

/**
 * 查询绑定银行卡忽略Players。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
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

/**
 * 添加绑定银行卡忽略玩家。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/withdrawConfig
 */
export function addBindCardIgnorePlayerApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerbindcardconfig/addignoreplayer',
    data,
  );
}

/**
 * 删除绑定银行卡忽略玩家。
 *
 * @param Id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deleteBindCardIgnorePlayerApi(Id: number | string) {
  return requestClient.post('/backend/playerbindcardconfig/delignoreplayer', {
    Id,
  });
}

/**
 * 查询USDT提现汇率。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchUsdtWithdrawRateApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentwithdrawconfig/getusdtrate',
  );
}

/**
 * 更新USDT提现汇率。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateUsdtWithdrawRateApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentwithdrawconfig/setusdtrate', data);
}

/**
 * 查询虚拟提现白名单。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
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

/**
 * 添加虚拟提现白名单。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/withdrawConfig
 */
export function addVirtualWithdrawWhitelistApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawtipconfig/addwhitelist', data);
}

/**
 * 检查虚拟提现白名单。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function checkVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/withdrawtipconfig/checkwhitelist',
    data,
  );
}

/**
 * 批量添加虚拟提现白名单。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function multiAddVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/withdrawtipconfig/multiaddwhitelist',
    data,
  );
}

/**
 * 删除虚拟提现白名单。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deleteVirtualWithdrawWhitelistApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/withdrawtipconfig/delwhitelist', data);
}

/**
 * 查询玩家额度列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchPlayerQuotaListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/withdrawtipconfig/playerquotalist',
  );
}

/**
 * 更新玩家额度。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updatePlayerQuotaApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawtipconfig/playerquotaedit', data);
}

/**
 * 删除玩家额度。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deletePlayerQuotaApi(id: number | string) {
  return requestClient.delete(
    `/backend/withdrawtipconfig/playerquotadelete/${id}`,
  );
}

/**
 * 查询玩家LevelsFor提现。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export async function fetchPlayerLevelsForWithdrawApi() {
  const result = await requestClient.get<PageResult>(
    '/backend/playerlevel/list',
    { params: { Page: 1, PageSize: 999 } },
  );
  return pageResult(result);
}

/**
 * 查询提现预计时间。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawEstimatedTimeApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/withdrawestimatedtimeconfig',
  );
}

/**
 * 更新提现预计时间。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawEstimatedTimeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawestimatedtimeconfig', data);
}
