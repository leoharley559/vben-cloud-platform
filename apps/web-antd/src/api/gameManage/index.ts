import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将数组或云后台列表响应归一化为 Items + Pagination 结构
 * @param data 原始数组或 CloudListResult 响应
 * @returns 含 Items 数组与 Pagination.MaxCount 的标准列表结果
 */
function toListResult(
  data:
    | Array<Record<string, unknown>>
    | CloudListResult<Record<string, unknown>>
    | null
    | undefined,
) {
  if (data == null) {
    return {
      Items: [],
      Pagination: { MaxCount: 0 },
    };
  }
  if (Array.isArray(data)) {
    return {
      Items: data,
      Pagination: { MaxCount: data.length },
    };
  }
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

/**
 * 查询包体列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchPackageListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/package/list', {
      params: query,
    })
    .then(toListResult);
}

/**
 * 查询渠道列表（含分页与家长/资源扩展字段）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/channel/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

/**
 * 查询域名列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchDomainListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/domain/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

/**
 * 切换单个域名启用/停用状态。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateDomainInUseApi(data: {
  Domain: string;
  DomainType: number;
  InUsed: number;
  State?: number;
}) {
  return requestClient.put('/backend/domain/inused', data);
}

/**
 * 批量切换域名启用/停用状态。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口响应数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function batchUpdateDomainInUseApi(data: {
  DomainIds: Array<number | string>;
  DomainType: number;
  InUsed: number;
}) {
  return requestClient.put('/backend/domain/inusedbatch', data);
}

/**
 * 编辑域名所属包体与备注。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateDomainApi(data: {
  Id: Array<number | string> | number | string;
  PackageId: string;
  Remark: string;
}) {
  return requestClient.put('/backend/domain/edit', data);
}

/**
 * 查询场馆/钱包费率开关列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchSiteFeeSwitchListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      Array<Record<string, unknown>> | CloudListResult<Record<string, unknown>>
    >('/backend/apifeeswitch/list', { params: trimSpace(query) })
    .then(toListResult);
}

/**
 * 查询充值类型列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeTypeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdrechargetypeagentconfig/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询提现账户列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchWithdrawAccountListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentwithdrawaccount/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询提现方式配置列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchWithdrawPayTypeConfigApi() {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/withdrawpaytypeconfig/list',
    )
    .then(toListResult);
}

/**
 * 保存提现方式手续费、区间与开关。
 *
 * @param id 记录 ID
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateWithdrawPayTypeConfigApi(
  id: number | string,
  data: Record<string, unknown>,
) {
  return requestClient.put(`/backend/withdrawpaytypeconfig/${id}`, data);
}

/**
 * 调整提现方式显示顺序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function sortWithdrawPayTypeConfigApi(data: { Ids: string }) {
  return requestClient.put('/backend/withdrawpaytypeconfig/exchange', data);
}

/**
 * 查询提现账户脚本运行状态。
 *
 * @param ids ID 列表（逗号分隔）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchWithdrawAccountStatusApi(ids: string) {
  return requestClient.get<Array<{ Id: number | string; Status: boolean }>>(
    '/backend/agentwithdrawaccount/statuslist',
    { params: { Ids: ids } },
  );
}

/**
 * 查询提现方式可选玩家层级。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
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

/**
 * 更新提现账户轮询权重或脚本模式。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateWithdrawAccountRoundApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentwithdrawaccount/round', data);
}

/**
 * 刷新三方提现账户余额。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function refreshWithdrawAccountBalanceApi(data: {
  Ids: number | string;
}) {
  return requestClient.put<Record<string, unknown>>(
    '/backend/agentwithdrawaccount/updateBalance',
    data,
  );
}

/**
 * 查询VIP等级列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipLevelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/viplevelconfig/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 查询短信服务列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchMessageServiceListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/shortmessageservice/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询广告模板列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchAdTemplateListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gameadtemplate/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询无尽Admin列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchEndlessAdminListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/wnlimitedproxydataadmin/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询返水方案列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchBackWaterSchemeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterscheme/allscheme',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询返水记录列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchBackWaterRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterrecord/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询iOS签名列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchIosSignatureListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/iossignature/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询iOS签名Log列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchIosSignatureLogListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/iossignature/logs',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询企业签iOS包体列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
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

/**
 * 查询手机号屏蔽列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchPhoneBlockListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/phonecountrycode/blocklist',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询币商客服客户列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchCoinDealerCustomerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporter/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询充值通道列表（保留后端元数据字段）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rechargechannel/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询充值日汇总。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeDailyTotalApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdrechargedailylog/total',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询三方提现列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchThirdWithdrawListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/thirdwithdrawtypeagentconfig/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询提现支付类型列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
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

/**
 * 查询返水审核列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchBackWaterReviewListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/playerbackwaterrecord/reviewlist',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询短信月度列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchSmsMonthListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/shortmessageservice/monthlist',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询短信渠道配置列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
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

/**
 * 查询注册验证码明细列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRegOtpDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/operation/phoneregisterotpdetail',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询存款召回列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchDepositRecallListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/operation/depositrecall',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询子推广渠道列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchSonPromoterChannelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/channel/listallsonpromoter',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 查询子游戏维护列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchSubGameMaintainListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/subgamemaintain/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 查询VIP虚拟奖励列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipVirtualPrizeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/viplevelconfig/listvirtualprize',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 查询VIP图标模板列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
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

/**
 * 编辑场馆/钱包开关与维护状态。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateSiteFeeSwitchApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/apifeeswitch/switch', data);
}

/**
 * 充值通道上下架。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function shelfRechargeTypeApi(data: {
  Id: number | string;
  OnShelf: number;
}) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/shelf', data);
}

/**
 * 切换充值通道启用状态。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function switchRechargeTypeUsedApi(data: {
  Id: number | string;
  InUsed: number;
}) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/used', data);
}

/**
 * 更新手机号区号屏蔽开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updatePhoneBlockApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/phonecountrycode/block', data);
}

/**
 * 编辑充值通道（别名/档位/开放人群等）
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateRechargeTypeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/thirdrechargetypeagentconfig/', data);
}

/**
 * 更新充值通道密钥参数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateRechargeTypeSecretApi(data: {
  Id: number | string;
  Params: string;
}) {
  return requestClient.put(
    '/backend/thirdrechargetypeagentconfig/editparams',
    data,
  );
}

/**
 * 编辑子游戏开关与维护信息。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateSubGameMaintainApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/subgamemaintain/updatelist', data);
}

/**
 * 子游戏排序（上移）
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateSubGameSortApi(data: {
  GameId: number | string;
  SubGameId: number | string;
}) {
  return requestClient.post('/backend/subgamemaintain/updatesortid', data);
}

/**
 * 批量编辑子游戏标签或开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口响应数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function batchUpdateSubGameApi(data: {
  IsOpen: number | string;
  SubGameIds: string;
  Tag: number | string;
  Type: 1 | 2;
}) {
  return requestClient.post('/backend/subgamemaintain/batchedit', data);
}

/**
 * 切换提现账户启用开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function switchWithdrawAccountApi(data: {
  Id: number | string;
  Switch: number;
}) {
  return requestClient.put('/backend/agentwithdrawaccount/switch', data);
}

/**
 * 查询提现账户明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchWithdrawAccountDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/agentwithdrawaccount/${id}`,
  );
}

/**
 * 新增提现账户。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function createWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentwithdrawaccount/', data);
}

/**
 * 更新提现账户。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateWithdrawAccountApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentwithdrawaccount/', data);
}

/**
 * 删除提现账户。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function deleteWithdrawAccountApi(id: number | string) {
  return requestClient.delete(`/backend/agentwithdrawaccount/${id}`);
}

/**
 * 生成充值兑换码。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function createRechargeVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentrechargeevoucherconfig', data);
}

/**
 * 编辑 VIP 虚拟等级奖励。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipVirtualPrizeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/virtualprize', data);
}

/**
 * 审核玩家返水记录。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function reviewBackWaterApi(data: {
  Approve: number;
  Ids: number | string;
  Real?: number;
}) {
  return requestClient.post('/backend/playerbackwaterrecord/review', data);
}

/**
 * 三方代付通道上下架。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function shelfThirdWithdrawApi(data: {
  Id: number | string;
  OnShelf: number;
}) {
  return requestClient.put('/backend/thirdwithdrawtypeagentconfig/shelf', data);
}

/**
 * 查询 VIP 保级天数。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipRelegationDayApi() {
  return requestClient.get<{ RelegationDay?: number }>(
    '/backend/viplevelconfig/getrelegationday',
  );
}

/**
 * 设置 VIP 保级天数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipRelegationDayApi(data: { RelegationDay: number }) {
  return requestClient.put('/backend/viplevelconfig/setrelegationday/', data);
}

/**
 * 查询 VIP 升级模式。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipLevelModeApi() {
  return requestClient.get<{ VipLevelMode?: number }>(
    '/backend/viplevelconfig/getviplevelmode',
  );
}

/**
 * 设置 VIP 升级模式。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipLevelModeApi(data: { VipLevelMode: number }) {
  return requestClient.put('/backend/viplevelconfig/setviplevelmode/', data);
}

/**
 * 更新包体备注说明。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updatePackageDescriptionApi(data: {
  Description: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/package/editdescription', data);
}

/**
 * 渠道详情。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchChannelDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/channel/${id}`);
}

/**
 * 编辑渠道邀请码。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateChannelInviteCodeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/channel/editinvitationcode', data);
}

/**
 * 查询 VIP 升级系数详情。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipCoefficientDetailApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/vipcoefficientconfig/detail',
  );
}

/**
 * 保存 VIP 升级系数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipCoefficientApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/vipcoefficientconfig/', data);
}

/**
 * 更新三方代付密钥参数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateThirdWithdrawSecretApi(data: {
  Id: number | string;
  Params: string;
}) {
  return requestClient.put(
    '/backend/thirdwithdrawtypeagentconfig/editparams',
    data,
  );
}

/**
 * 编辑三方代付通道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateThirdWithdrawApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/thirdwithdrawtypeagentconfig/', data);
}

/**
 * 查询手动返水可发放列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchBackWaterHandListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterrecord/waterlist',
    { params: trimSpace(query) },
  );
}

/**
 * 手动发放玩家返水。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function createBackWaterHandApi(data: {
  Desc?: string;
  PlayerId: number | string;
  Time: number;
  Water: number;
}) {
  return requestClient.post('/backend/playerbackwaterrecord/backwater', data);
}

/**
 * 查询 VIP 图标方案详情。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchVipIconsApi(data: { TemplateId: number | string }) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listicons/',
    data,
  );
}

/**
 * 新增 VIP 图标方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function addVipIconsTemplateApi(data: { TemplateName: string }) {
  return requestClient.put('/backend/viplevelconfig/addiconstemplate/', data);
}

/**
 * 重命名 VIP 图标方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipIconsTemplateNameApi(data: {
  TemplateId: number | string;
  TemplateName: string;
}) {
  return requestClient.put('/backend/viplevelconfig/iconstemplatename/', data);
}

/**
 * 删除 VIP 图标方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function deleteVipIconsTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/deleteiconstemplate/',
    data,
  );
}

/**
 * 恢复 VIP 图标方案为默认。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function resetVipIconsTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/resettodefaulttemplate/',
    data,
  );
}

/**
 * 重命名返水方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateBackWaterSchemeNameApi(data: {
  Id: number | string;
  Name: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/name', data);
}

/**
 * 查询返水方案详情。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchBackWaterSchemeDetailApi(query: { Id: number | string }) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterscheme/scheme',
    { params: query },
  );
}

/**
 * 保存返水方案规则文案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateBackWaterSchemeRuleApi(data: {
  Id: number | string;
  LangText: string;
  Rule: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/rule', data);
}

/**
 * 新增返水方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function createBackWaterSchemeApi(data: {
  LangGroupId: number | string;
}) {
  return requestClient.post('/backend/playerbackwaterscheme/', data);
}

/**
 * 删除返水方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function deleteBackWaterSchemeApi(id: number | string) {
  return requestClient.get(`/backend/playerbackwaterscheme/${id}`);
}

/**
 * 查询出款银行列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchWithdrawBankListApi() {
  return requestClient
    .get<
      Array<Record<string, unknown>> | CloudListResult<Record<string, unknown>>
    >('/backend/bankconfig/list')
    .then(toListResult);
}

/**
 * 切换出款银行开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateWithdrawBankSwitchApi(data: {
  IsOpen: number;
  Key: number | string;
}) {
  return requestClient.put(`/backend/bankconfig/${data.Key}`, data);
}

/**
 * 批量切换出款银行开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口响应数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function batchUpdateWithdrawBankApi(data: {
  IsOpen: number;
  Keys: string;
}) {
  return requestClient.post('/backend/bankconfig/batchedit', data);
}

/**
 * 保存 VIP 图标行配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateVipIconsApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/icons/', data);
}

/**
 * 查询热门子游戏（连中大奖展示用）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchHotSubGameListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<{ Name?: string; SubGameId?: number | string }>;
  }>('/backend/subgamemaintain/listsorthottag', {
    params: { Page: 1, PageSize: 999, ...query },
  });
}

/**
 * 查询充值通道堵塞提示配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeFailTipConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/rechargefailtipconfig',
  );
}

/**
 * 保存充值通道堵塞提示配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateRechargeFailTipConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargefailtipconfig', data);
}

/**
 * 查询可充值姓名数量配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeNameConfigApi() {
  return requestClient.get<{ RechargeNameConfig?: string }>(
    '/backend/rechargenameconfig/',
  );
}

/**
 * 设置可充值姓名数量上限。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateRechargeNameConfigApi(data: { RechargeNameNum: number }) {
  return requestClient.put('/backend/rechargenameconfig/', data);
}

/**
 * 查询充值姓名玩家列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeNamePlayerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rechargenameconfig/playerlist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 添加充值姓名玩家。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function addRechargeNamePlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargenameconfig/addplayer', data);
}

/**
 * 删除充值姓名玩家。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function deleteRechargeNamePlayerApi(id: number | string) {
  return requestClient.delete(`/backend/rechargenameconfig/delplayer/${id}`);
}

/**
 * 查询首存最低金额限制。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchMinFirstRechargeConfigApi() {
  return requestClient.get<{ MinFirstRechargeConfig?: number }>(
    '/backend/minfirstrechargeconfig',
  );
}

/**
 * 设置首存最低金额限制。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateMinFirstRechargeConfigApi(data: {
  MinFirstRechargeConfig: number;
}) {
  return requestClient.put('/backend/minfirstrechargeconfig', data);
}

/**
 * 查询充值取消次数与原因开关。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeCancelConfigApi() {
  return requestClient.get<{
    CancelReasonSwitch?: number;
    MaxCancelPerDay?: number;
  }>('/backend/rechargenumberconfig/');
}

/**
 * 查询充值取消提示文案配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function fetchRechargeCancelTipConfigApi() {
  return requestClient.get<{
    Item?: Array<Record<string, unknown>>;
    Items?: Array<Record<string, unknown>>;
    MaxCancelPerDay?: number;
  }>('/backend/golobalgametipconfig/');
}

/**
 * 保存充值取消次数与原因开关。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/*（域名/站点/渠道/充值/提现/VIP/返水等）
 */
export function updateRechargeCancelConfigApi(data: {
  CancelReasonSwitch: number;
  MaxCancelPerDay: number;
}) {
  return requestClient.put('/backend/rechargenumberconfig/', data);
}
