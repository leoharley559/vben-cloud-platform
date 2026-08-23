import type {
  CloudListResult,
  PlayerListItem,
  PlayerListQuery,
} from '#/types/operation-manage';
import type {
  PlayerBasicInfo,
  PlayerGoldChangeItem,
  PlayerGoldPeriodItem,
  PlayerGoldPeriodTotal,
  PlayerGoldQuery,
  PlayerLoginIpRecord,
  PlayerLoginQuery,
  PlayerLoginStatItem,
  PlayerSettleItem,
  PlayerWalletListResult,
} from '#/types/player-detail';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 规范化玩家列表查询参数。
 *
 * 去除首尾空格；Status、ChannelIds 多选转逗号字符串；PlayerIdsStr 支持中文逗号并去重 trim。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizePlayerQuery(query: PlayerListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;

  const status = params.Status;
  if (Array.isArray(status)) {
    params.Status = status.length > 0 ? status.join(',') : '';
  }

  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length > 0 ? channelIds.join(',') : '';
  }

  const playerIdsStr = params.PlayerIdsStr;
  if (typeof playerIdsStr === 'string' && playerIdsStr) {
    params.PlayerIdsStr = playerIdsStr
      .replaceAll('，', ',')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',');
  }

  // 对齐旧站：游戏账号/上级账号强制小写并去空格
  for (const key of ['LoginAccount', 'InviterLoginAccount'] as const) {
    const value = params[key];
    if (typeof value === 'string' && value) {
      params[key] = value.toLowerCase().replaceAll(/\s/g, '');
    }
  }

  return params;
}

/**
 * 分页查询玩家列表。
 *
 * @param query 账号、渠道、状态等筛选及分页参数
 * @returns 玩家 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/playerList/index.vue
 * @see views/memberManage/streamingInformation/index.vue
 */
export async function fetchPlayerListApi(query: PlayerListQuery) {
  const result = await requestClient.get<CloudListResult<PlayerListItem>>(
    '/backend/playerinfo/list',
    {
      params: normalizePlayerQuery(query),
    },
  );
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
    Total: result?.Total || {},
  };
}

/**
 * 导出玩家列表 CSV（pageId=32）。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/playerList/index.vue
 */
export function exportPlayerListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playerinfo/listcsv',
    { params: normalizePlayerQuery(params as unknown as PlayerListQuery) },
  );
}

/**
 * 获取玩家基础信息详情。
 *
 * @param playerId 玩家 ID
 * @returns 玩家基础信息对象
 * @see views/operationalManage/playerDetails/index.vue
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function fetchPlayerBasicInfoApi(playerId: number | string) {
  return requestClient.get<PlayerBasicInfo>(`/backend/playerinfo/${playerId}`);
}

/**
 * 按登录账号查询玩家（支持产品包筛选）。
 *
 * @param params LoginAccount 账号；PackageId/PackageName 可选产品包
 * @returns 匹配的玩家列表 Items
 * @see views/operationalManage/accountAdjust/components/adjust-form.vue
 * @see views/memberManage/walletManage/components/e-wallet-form-modal.vue
 */
export function queryPlayerByAccountApi(params: {
  LoginAccount: string;
  PackageId?: number | string;
  PackageName?: string;
}) {
  return requestClient.get<CloudListResult<PlayerListItem>>(
    '/backend/playerinfo/queryplayer',
    {
      params: trimSpace(params),
    },
  );
}

/**
 * 批量按账号+产品包匹配玩家（红利批量发放 Excel 导入）。
 *
 * @param data LoginAccount、PackageName 及可选 MultiAmount
 * @returns 匹配的玩家列表 Items
 */
export function queryPlayerByExcelApi(data: {
  LoginAccount: string;
  MultiAmount?: string;
  PackageName: string;
}) {
  return requestClient.post<CloudListResult<PlayerListItem>>(
    '/backend/playerinfo/queryplayerexcel',
    data,
  );
}

/**
 * 获取玩家各场馆钱包列表。
 *
 * @param playerId 玩家 ID
 * @returns 钱包列表及汇总信息
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function fetchPlayerWalletListApi(playerId: number | string) {
  return requestClient.get<PlayerWalletListResult>(
    '/backend/playerwallet/list',
    {
      params: { PlayerId: playerId },
    },
  );
}

/**
 * 分页查询玩家登录 IP 记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 登录 IP 记录 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-login-history.vue
 */
export function fetchPlayerLoginIpListApi(query: PlayerLoginQuery) {
  return requestClient.get<CloudListResult<PlayerLoginIpRecord>>(
    '/backend/playerloginip/list',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 分页查询玩家登录统计（按设备/渠道汇总）。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 登录统计 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-login-statistics.vue
 */
export function fetchPlayerLoginInfoListApi(query: PlayerLoginQuery) {
  return requestClient.get<CloudListResult<PlayerLoginStatItem>>(
    '/backend/playerlogininfo/list',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 分页查询玩家金币期初/期末汇总。
 *
 * @param query 玩家 ID、时间范围及分页参数
 * @returns 金币期汇总 Items、Pagination 及 Total
 * @see views/operationalManage/playerDetails/components/player-coin-period.vue
 */
export function fetchPlayerGoldTotalApi(query: PlayerGoldQuery) {
  return requestClient.get<
    CloudListResult<PlayerGoldPeriodItem> & {
      Total?: PlayerGoldPeriodTotal;
    }
  >('/backend/playerinfo/goldtotal', {
    params: trimSpace(query),
  });
}

/**
 * 分页查询玩家金币变动明细。
 *
 * @param query 玩家 ID、时间、原因等筛选及分页参数
 * @returns 金币变动 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-gold-change.vue
 */
export function fetchPlayerGoldChangeListApi(query: PlayerGoldQuery) {
  return requestClient.get<CloudListResult<PlayerGoldChangeItem>>(
    '/backend/playergoldchange/list',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 分页查询玩家结算记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 结算记录 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-coin-settle.vue
 */
export function fetchPlayerSettleListApi(query: PlayerGoldQuery) {
  return requestClient.get<CloudListResult<PlayerSettleItem>>(
    '/backend/playersettle/list',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 编辑玩家 VIP 等级。
 *
 * @param data PlayerId、VipLevel 及可选 UpField
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerVipLevelApi(data: {
  PlayerId: number | string;
  UpField?: string;
  VipLevel: number | string;
}) {
  return requestClient.put('/backend/playerinfo/editviplevel', data);
}

/**
 * 编辑玩家真实姓名、邮箱、地址、生日等扩展信息。
 *
 * @param data 玩家 Id 及待更新字段
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerOtherApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerinfo/editother', data);
}

/**
 * 编辑玩家绑定手机号。
 *
 * @param data PlayerId、BindPhone、DialingCode 及可选 UpField
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerBindPhoneApi(data: {
  BindPhone: string;
  DialingCode?: string;
  PlayerId: number | string;
  UpField?: string;
}) {
  return requestClient.put('/backend/playerinfo/editbindphone', data);
}

/**
 * 绑定玩家上级/推荐人。
 *
 * @param data PlayerId 与 BindLoginAccount 上级账号
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerInviterApi(data: {
  BindLoginAccount: string;
  PlayerId: number | string;
}) {
  return requestClient.post('/backend/playerinfo/bind', data);
}

/**
 * 修改玩家登录密码。
 *
 * @param data PlayerId、NewPassword 及可选 ValidCode
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerPasswordApi(data: {
  NewPassword: string;
  PlayerId: number | string;
  UpField?: string;
  ValidCode?: string;
}) {
  return requestClient.put('/backend/playerinfo/editpassword', data);
}

/**
 * 分配玩家会员层级。
 *
 * @param data PlayerId 与 PlayerLevelId
 * @returns 接口响应
 * @see views/operationalManage/playerList/components/player-level-modal.vue
 */
export function updatePlayerLevelAssignApi(data: {
  PlayerId: number | string;
  PlayerLevelId: number | string;
}) {
  return requestClient.post('/backend/playerinfo/editplayerlevel', data);
}

/**
 * 编辑场馆解锁流水（0=解锁，大于 0=冻结）。
 *
 * @param data PlayerId、GameId、UnlockWater
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function updateWalletUnlockWaterApi(data: {
  GameId: number | string;
  PlayerId: number | string;
  UnlockWater: number;
}) {
  return requestClient.put('/backend/playerwallet/unlockwater', data);
}

/**
 * 回收单个场馆钱包余额至主钱包。
 *
 * @param data PlayerId 与 GameId
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function recoverPlayerWalletApi(data: {
  GameId: number | string;
  PlayerId: number | string;
}) {
  return requestClient.post('/backend/playerwallet/recovery', data);
}

/**
 * 回收玩家全部场馆钱包余额至主钱包。
 *
 * @param data PlayerId
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function recoverAllPlayerWalletApi(data: { PlayerId: number | string }) {
  return requestClient.post('/backend/playerwallet/recoveryall', data);
}

/**
 * 子钱包负值清零（通过 query params 传参）。
 *
 * @param params PlayerId、GameId、Balance
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-wallet.vue
 */
export function walletZeroApi(params: {
  Balance: number | string;
  GameId: number | string;
  PlayerId: number | string;
}) {
  return requestClient.post(
    '/backend/playerwallet/walletzero',
    {},
    {
      params,
    },
  );
}

/**
 * 更新玩家扩展状态（封号/禁提/踢下线等）。
 *
 * @param data PlayerId、Status 及可选 Remark、BlockTime
 * @returns 接口响应
 * @see views/operationalManage/playerList/components/player-kick-modal.vue
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerExtApi(data: {
  BlockTime?: number;
  LastBlockTime?: number;
  PlayerId: number | string;
  Remark?: string;
  Status: number;
}) {
  return requestClient.put('/backend/playerext/', data);
}

/**
 * 分页查询玩家备注列表。
 *
 * @param query PlayerId 及分页参数；IsSelf 是否仅本人备注
 * @returns 备注 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-remark-list.vue
 * @see views/operationalManage/playerList/components/player-list-remark-drawer.vue
 */
export function fetchPlayerRemarkListApi(query: {
  IsSelf?: boolean;
  Page: number;
  PageSize: number;
  PlayerId: number | string;
}) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerremark/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增玩家备注。
 *
 * @param data PlayerId、Remark 及可选 Hash
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-remark-list.vue
 */
export function createPlayerRemarkApi(data: {
  Hash?: string;
  PlayerId: number | string;
  Remark: string;
}) {
  return requestClient.post('/backend/playerremark/', data);
}

/**
 * 编辑玩家备注。
 *
 * @param data Id、Remark 及可选 PlayerId
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-remark-list.vue
 */
export function updatePlayerRemarkApi(data: {
  Id: number | string;
  PlayerId?: number | string;
  Remark: string;
}) {
  return requestClient.put('/backend/playerremark/', data);
}

/**
 * 删除玩家备注。
 *
 * @param id 备注 ID
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-remark-list.vue
 */
export function deletePlayerRemarkApi(id: number | string) {
  return requestClient.delete(`/backend/playerremark/${id}`);
}

/**
 * 玩家列表批量编辑（标签、层级等）。
 *
 * @param data 批量玩家 Id 及待更新字段
 * @returns 接口响应
 * @see views/operationalManage/playerList/components/player-batch-edit-modal.vue
 */
export function batchUpdatePlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerinfo/batchupdate', data);
}

/**
 * 分页查询玩家标签列表。
 *
 * @param query 可选分页参数，默认 Page=1、PageSize=200
 * @returns 标签 Items 与 Pagination
 * @see views/operationalManage/playerList/components/player-tag-modal.vue
 * @see views/gameManage/withdrawConfig/components/withdraw-risk-panel.vue
 */
export async function fetchPlayerTagListApi(query?: {
  Page?: number;
  PageSize?: number;
}) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/playertag/list', {
    params: query || { Page: 1, PageSize: 200 },
  });
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 编辑玩家标签（打标）。
 *
 * @param data PlayerId、TagId、TagName
 * @returns 接口响应
 * @see views/operationalManage/playerList/components/player-tag-modal.vue
 */
export function updatePlayerTagApi(data: {
  PlayerId: number | string;
  TagId: string;
  TagName: string;
}) {
  return requestClient.post('/backend/playerext/edittag', data);
}

/**
 * 解绑玩家手机号。
 *
 * @param data PlayerId 及可选 ValidCode
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function unbindPlayerPhoneApi(data: {
  PlayerId: number | string;
  ValidCode?: string;
}) {
  return requestClient.put('/backend/playerinfo/unbindphone', data);
}

/**
 * 编辑玩家 Viber（QQ）/ Telegram（微信）绑定。
 *
 * @param data 玩家 Id 及绑定字段
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerBindQqWechatApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerinfo/editbindqqwechat', data);
}

/**
 * 编辑玩家 Facebook 绑定。
 *
 * @param data 玩家 Id 及 Facebook 绑定字段
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerBindFacebookApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerinfo/editbindfacebook', data);
}

/**
 * 获取产品包邀请站点配置。
 *
 * @param packageId 产品包 ID
 * @returns 邀请站点配置
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function fetchPackageSiteConfigApi(packageId: number | string) {
  return requestClient.get('/backend/package/packagesiteconfig', {
    params: { PackageId: packageId },
  });
}

/**
 * 编辑玩家邀请站点。
 *
 * @param data PlayerId、InviteSite 及可选 ValidCode
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerInviteSiteApi(data: {
  InviteSite: string;
  PlayerId: number | string;
  ValidCode?: string;
}) {
  return requestClient.put('/backend/playerinfo/editinvitesite', data);
}

/**
 * 获取玩家证件信息。
 *
 * @param playerId 玩家 ID
 * @returns 证件信息对象
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function fetchPlayerCardApi(playerId: number | string) {
  return requestClient.get(`/backend/playercard/${playerId}`);
}

/**
 * 编辑玩家证件信息。
 *
 * @param data 证件字段及 PlayerId
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function updatePlayerCardApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playercard', data);
}

/**
 * 获取玩家身份证正反面照片。
 *
 * @param data PlayerId
 * @returns 正反面图片 URL 或 Base64
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function fetchPlayerIdCardImagesApi(data: {
  PlayerId: number | string;
}) {
  return requestClient.post('/backend/playercard/getidnumcardimage', data);
}

/**
 * 上传玩家身份证正反面照片。
 *
 * @param data PlayerId 及 FrontIdNumCardImg、BackIdNumCardImg
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-basic-info.vue
 */
export function uploadPlayerIdCardImagesApi(data: {
  BackIdNumCardImg?: string;
  FrontIdNumCardImg?: string;
  PlayerId: number | string;
}) {
  return requestClient.post('/backend/playercard/uploadidnumcardimage', data);
}
