import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

export function fetchPackageListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/package/list', {
      params: query,
    })
    .then(toListResult);
}

export function fetchChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/channel/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function fetchDomainListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/domain/list', {
      params: query,
    })
    .then(toListResult);
}

export function fetchSiteFeeSwitchListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/apifeeswitch/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchRechargeTypeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdrechargetypeagentconfig/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchWithdrawAccountListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentwithdrawaccount/list',
      { params: query },
    )
    .then(toListResult);
}

/** 提现方式配置列表 */
export function fetchWithdrawPayTypeConfigApi() {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/withdrawpaytypeconfig/list',
    )
    .then(toListResult);
}

/** 保存提现方式手续费、区间、开关等配置 */
export function updateWithdrawPayTypeConfigApi(
  id: number | string,
  data: Record<string, unknown>,
) {
  return requestClient.put(`/backend/withdrawpaytypeconfig/${id}`, data);
}

/** 调整提现方式显示顺序 */
export function sortWithdrawPayTypeConfigApi(data: { Ids: string }) {
  return requestClient.put('/backend/withdrawpaytypeconfig/exchange', data);
}

/** 提现账户脚本状态 */
export function fetchWithdrawAccountStatusApi(ids: string) {
  return requestClient.get<Array<{ Id: number | string; Status: boolean }>>(
    '/backend/agentwithdrawaccount/statuslist',
    { params: { Ids: ids } },
  );
}

/** 提现方式可选玩家层级 */
export function fetchWithdrawPlayerLevelListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerlevel/list',
      {
        params: query,
      },
    )
    .then(toListResult);
}

/** 提现账户轮询权重或脚本模式 */
export function updateWithdrawAccountRoundApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentwithdrawaccount/round', data);
}

/** 刷新三方提现账户余额 */
export function refreshWithdrawAccountBalanceApi(data: {
  Ids: number | string;
}) {
  return requestClient.put<Record<string, unknown>>(
    '/backend/agentwithdrawaccount/updateBalance',
    data,
  );
}

export function fetchVipLevelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/viplevelconfig/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchMessageServiceListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/shortmessageservice/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchAdTemplateListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gameadtemplate/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchEndlessAdminListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/wnlimitedproxydataadmin/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchBackWaterSchemeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterscheme/allscheme',
      { params: query },
    )
    .then(toListResult);
}

export function fetchBackWaterRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterrecord/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchIosSignatureListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/iossignature/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchIosSignatureLogListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/iossignature/logs',
      { params: query },
    )
    .then(toListResult);
}

export function fetchEnterpriseIosPackageListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/packagelinkios/listpackageiosdetail',
      { params: query },
    )
    .then(toListResult);
}

export function fetchPhoneBlockListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/phonecountrycode/blocklist',
      { params: query },
    )
    .then(toListResult);
}

export function fetchCoinDealerCustomerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporter/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchRechargeChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rechargechannel/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchRechargeDailyTotalApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdrechargedailylog/total',
      { params: query },
    )
    .then(toListResult);
}

export function fetchThirdWithdrawListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdwithdrawtypeagentconfig/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchWithdrawPayTypeListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/withdrawpaytypeconfig/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchBackWaterReviewListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterrecord/reviewlist',
      { params: query },
    )
    .then(toListResult);
}

export function fetchSmsMonthListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/shortmessageservice/monthlist',
      { params: query },
    )
    .then(toListResult);
}

export function fetchSmsChannelConfigListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/smschannelconfig/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchRegOtpDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/operation/phoneregisterotpdetail',
      { params: query },
    )
    .then(toListResult);
}

export function fetchDepositRecallListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/operation/depositrecall',
      { params: query },
    )
    .then(toListResult);
}

export function fetchSonPromoterChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/channel/listallsonpromoter',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchSubGameMaintainListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/subgamemaintain/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchVipVirtualPrizeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/viplevelconfig/listvirtualprize',
      { params: query },
    )
    .then(toListResult);
}

export function fetchVipIconTemplateListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/viplevelconfig/listiconstemplates/',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items,
        Pagination: { MaxCount: items.length },
      };
    });
}

/** 场馆/钱包开关与维护编辑 */
export function updateSiteFeeSwitchApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/apifeeswitch/switch', data);
}

/** 充值通道上下架 */
export function shelfRechargeTypeApi(data: {
  Id: number | string;
  OnShelf: number;
}) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/shelf', data);
}

/** 已使用通道开启/关闭 */
export function switchRechargeTypeUsedApi(data: {
  Id: number | string;
  InUsed: number;
}) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/used', data);
}

/** 区号屏蔽开关 */
export function updatePhoneBlockApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/phonecountrycode/block', data);
}

/** 充值通道编辑（别名/档位/开放人群等） */
export function updateRechargeTypeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/', data);
}

/** 充值通道密钥参数 */
export function updateRechargeTypeSecretApi(data: {
  Id: number | string;
  Params: string;
}) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/editparams',
    data,
  );
}

/** 子游戏编辑/开关 */
export function updateSubGameMaintainApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/subgamemaintain/updatelist', data);
}

/** 子游戏排序（上移） */
export function updateSubGameSortApi(data: {
  GameId: number | string;
  SubGameId: number | string;
}) {
  return requestClient.post('/backend/subgamemaintain/updatesortid', data);
}

/** 提现账户启用开关 */
export function switchWithdrawAccountApi(data: {
  Id: number | string;
  Switch: number;
}) {
  return requestClient.put('/backend/agentwithdrawaccount/switch', data);
}

export function fetchWithdrawAccountDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/agentwithdrawaccount/${id}`,
  );
}

export function createWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentwithdrawaccount/', data);
}

export function updateWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentwithdrawaccount/', data);
}

export function deleteWithdrawAccountApi(id: number | string) {
  return requestClient.delete(`/backend/agentwithdrawaccount/${id}`);
}

/** 兑换码生成 */
export function createRechargeVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentrechargeevoucherconfig', data);
}

/** VIP 虚拟等级编辑 */
export function updateVipVirtualPrizeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/virtualprize', data);
}

/** 返水审核 */
export function reviewBackWaterApi(data: {
  Approve: number;
  Ids: number | string;
  Real?: number;
}) {
  return requestClient.post('/backend/playerbackwaterrecord/review', data);
}

/** 三方代付上下架 */
export function shelfThirdWithdrawApi(data: {
  Id: number | string;
  OnShelf: number;
}) {
  return requestClient.put('/backend/thirdwithdrawtypeagentconfig/shelf', data);
}

/** VIP 保级天数 */
export function fetchVipRelegationDayApi() {
  return requestClient.get<{ RelegationDay?: number }>(
    '/backend/viplevelconfig/getrelegationday',
  );
}

export function updateVipRelegationDayApi(data: { RelegationDay: number }) {
  return requestClient.put('/backend/viplevelconfig/setrelegationday/', data);
}

/** VIP 升级模式 */
export function fetchVipLevelModeApi() {
  return requestClient.get<{ VipLevelMode?: number }>(
    '/backend/viplevelconfig/getviplevelmode',
  );
}

export function updateVipLevelModeApi(data: { VipLevelMode: number }) {
  return requestClient.put('/backend/viplevelconfig/setviplevelmode/', data);
}

/** 包体备注 */
export function updatePackageDescriptionApi(data: {
  Description: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/package/editdescription', data);
}

/** 渠道详情 */
export function fetchChannelDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/channel/${id}`);
}

/** 渠道邀请码 */
export function updateChannelInviteCodeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/channel/editinvitationcode', data);
}

/** VIP 升级系数详情 */
export function fetchVipCoefficientDetailApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/vipcoefficientconfig/detail',
  );
}

/** VIP 升级系数保存 */
export function updateVipCoefficientApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/vipcoefficientconfig/', data);
}

/** 三方代付密钥参数 */
export function updateThirdWithdrawSecretApi(data: {
  Id: number | string;
  Params: string;
}) {
  return requestClient.put(
    '/backend/thirdwithdrawtypeagentconfig/editparams',
    data,
  );
}

/** 三方代付通道编辑 */
export function updateThirdWithdrawApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/thirdwithdrawtypeagentconfig/', data);
}

/** 手动返水查询 */
export function fetchBackWaterHandListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterrecord/waterlist',
    { params: trimSpace(query) },
  );
}

/** 手动返水发放 */
export function createBackWaterHandApi(data: {
  Desc?: string;
  PlayerId: number | string;
  Time: number;
  Water: number;
}) {
  return requestClient.post('/backend/playerbackwaterrecord/backwater', data);
}

/** VIP 图标方案详情 */
export function fetchVipIconsApi(data: { TemplateId: number | string }) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listicons/',
    data,
  );
}

/** 新增 VIP 图标方案 */
export function addVipIconsTemplateApi(data: { TemplateName: string }) {
  return requestClient.put('/backend/viplevelconfig/addiconstemplate/', data);
}

/** 重命名 VIP 图标方案 */
export function updateVipIconsTemplateNameApi(data: {
  TemplateId: number | string;
  TemplateName: string;
}) {
  return requestClient.put('/backend/viplevelconfig/iconstemplatename/', data);
}

/** 删除 VIP 图标方案 */
export function deleteVipIconsTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/deleteiconstemplate/',
    data,
  );
}

/** 恢复默认 VIP 图标方案 */
export function resetVipIconsTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/resettodefaulttemplate/',
    data,
  );
}

/** 返水方案重命名 */
export function updateBackWaterSchemeNameApi(data: {
  Id: number | string;
  Name: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/name', data);
}

/** 返水方案详情 */
export function fetchBackWaterSchemeDetailApi(query: { Id: number | string }) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterscheme/scheme',
    { params: query },
  );
}

/** 返水方案规则保存 */
export function updateBackWaterSchemeRuleApi(data: {
  Id: number | string;
  LangText: string;
  Rule: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/rule', data);
}

/** 新增返水方案 */
export function createBackWaterSchemeApi(data: {
  LangGroupId: number | string;
}) {
  return requestClient.post('/backend/playerbackwaterscheme/', data);
}

/** 删除返水方案（旧站为 GET） */
export function deleteBackWaterSchemeApi(id: number | string) {
  return requestClient.get(`/backend/playerbackwaterscheme/${id}`);
}

/** 出款银行列表 */
export function fetchWithdrawBankListApi() {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/bankconfig/list',
  );
}

/** 出款银行开关 */
export function updateWithdrawBankSwitchApi(data: {
  IsOpen: number;
  Key: number | string;
}) {
  return requestClient.put(`/backend/bankconfig/${data.Key}`, data);
}

/** 出款银行批量开关 */
export function batchUpdateWithdrawBankApi(data: {
  IsOpen: number;
  Keys: string;
}) {
  return requestClient.post('/backend/bankconfig/batchedit', data);
}

/** VIP 图标行保存 */
export function updateVipIconsApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/icons/', data);
}

/** 热门子游戏（连中大奖） */
export function fetchHotSubGameListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<{ Name?: string; SubGameId?: number | string }>;
  }>('/backend/subgamemaintain/listsorthottag', {
    params: { Page: 1, PageSize: 999, ...query },
  });
}

/** 充值通道堵塞提示配置 */
export function fetchRechargeFailTipConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/rechargefailtipconfig',
  );
}

export function updateRechargeFailTipConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargefailtipconfig', data);
}

/** 可充值姓名数量配置 */
export function fetchRechargeNameConfigApi() {
  return requestClient.get<{ RechargeNameConfig?: string }>(
    '/backend/rechargenameconfig/',
  );
}

export function updateRechargeNameConfigApi(data: { RechargeNameNum: number }) {
  return requestClient.put('/backend/rechargenameconfig/', data);
}

export function fetchRechargeNamePlayerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rechargenameconfig/playerlist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function addRechargeNamePlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargenameconfig/addplayer', data);
}

export function deleteRechargeNamePlayerApi(id: number | string) {
  return requestClient.delete(`/backend/rechargenameconfig/delplayer/${id}`);
}

/** 首存最低限制 */
export function fetchMinFirstRechargeConfigApi() {
  return requestClient.get<{ MinFirstRechargeConfig?: number }>(
    '/backend/minfirstrechargeconfig',
  );
}

export function updateMinFirstRechargeConfigApi(data: {
  MinFirstRechargeConfig: number;
}) {
  return requestClient.put('/backend/minfirstrechargeconfig', data);
}

/** 充值取消设置 */
export function fetchRechargeCancelConfigApi() {
  return requestClient.get<{
    CancelReasonSwitch?: number;
    MaxCancelPerDay?: number;
  }>('/backend/rechargenumberconfig/');
}

export function fetchRechargeCancelTipConfigApi() {
  return requestClient.get<{
    Item?: Array<Record<string, unknown>>;
    Items?: Array<Record<string, unknown>>;
    MaxCancelPerDay?: number;
  }>('/backend/golobalgametipconfig/');
}

export function updateRechargeCancelConfigApi(data: {
  CancelReasonSwitch: number;
  MaxCancelPerDay: number;
}) {
  return requestClient.put('/backend/rechargenumberconfig/', data);
}
