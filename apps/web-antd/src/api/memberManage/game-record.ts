import type {
  EvoSideBetListItem,
  EvoSideBetListQuery,
} from '#/types/evo-sidebet';
import type { GameRecordListQuery } from '#/types/game-record';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerBetRecordItem,
  PlayerBetSummary,
} from '#/types/player-detail';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeListResult<T>(
  result:
    | (CloudListResult<T> & { MoreItems?: PlayerBetSummary })
    | null
    | undefined,
) {
  return {
    Items: result?.Items || [],
    MoreItems: result?.MoreItems,
    Pagination: result?.Pagination,
  };
}

/**
 * 归一化游戏投注记录查询参数，适配后端接口约定
 * @param query 前端游戏记录筛选/分页参数
 * @returns trim 后的请求参数（多选数组转逗号分隔，投注金额乘 100）
 */
function normalizeGameRecordQuery(query: GameRecordListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const gameIds = params.GameIds;
  if (Array.isArray(gameIds)) {
    params.GameIds = gameIds.length > 0 ? gameIds.join(',') : '';
  }
  const vipLevel = params.VipLevel;
  if (Array.isArray(vipLevel)) {
    params.VipLevel = vipLevel.length > 0 ? vipLevel.join(',') : '';
  }
  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length > 0 ? channelIds.join(',') : '';
  }
  const inviteSite = params.InviteSite;
  if (Array.isArray(inviteSite)) {
    params.InviteSite = inviteSite.length > 0 ? inviteSite.join(',') : '';
  }
  const playerStatus = params.PlayerStatus;
  if (Array.isArray(playerStatus)) {
    params.PlayerStatus = playerStatus.length > 0 ? playerStatus.join(',') : '';
  }
  const venueTypes = params.VenueTypes;
  if (Array.isArray(venueTypes)) {
    params.VenueTypes = venueTypes.length > 0 ? venueTypes.join(',') : '';
  }
  const appUrl = params.AppUrl;
  if (Array.isArray(appUrl)) {
    params.AppUrl = appUrl.length > 0 ? appUrl.join(',') : '';
  }
  const devicePlatform = params.DevicePlatform;
  if (Array.isArray(devicePlatform)) {
    params.DevicePlatform = devicePlatform.length > 0
      ? devicePlatform.join(',')
      : '';
  }

  if (params.BeginBetGold !== undefined && params.BeginBetGold !== '') {
    params.BeginBetGold = Number(params.BeginBetGold) * 100;
  } else {
    delete params.BeginBetGold;
  }
  if (params.EndBetGold !== undefined && params.EndBetGold !== '') {
    params.EndBetGold = Number(params.EndBetGold) * 100;
  } else {
    delete params.EndBetGold;
  }

  delete params.VenuesTemp;
  return params;
}

/**
 * 游戏投注记录列表（游戏记录页 / 玩家详情 · 投注记录主表格及汇总）。
 *
 * @param query 查询参数（玩家、游戏、场馆、时间、金额等筛选及分页）
 * @returns 投注记录 Items、Pagination 及 MoreItems 汇总
 * @see views/memberManage/gameRecord/components/game-record-list-panel.vue
 * @see views/operationalManage/playerDetails/components/player-bet-record.vue
 */
export async function fetchGameRecordListApi(query: GameRecordListQuery) {
  const result = await requestClient.get<
    CloudListResult<PlayerBetRecordItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiondetail', {
    params: normalizeGameRecordQuery(query),
  });
  return normalizeListResult(result);
}

/**
 * 导出游戏投注记录 Excel（游戏记录页导出，pageId=35）。
 *
 * @param params 与列表一致的筛选参数（不含分页）
 * @returns 导出任务信息（Id、Remark、Status）
 * @see views/memberManage/gameRecord/components/game-record-list-panel.vue
 */
export function exportGameRecordListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/operation/gametransactiondetailexcel',
    { params: normalizeGameRecordQuery(params as unknown as GameRecordListQuery) },
  );
}

/**
 * 已结算注单结算流水（游戏记录 · 已结算状态弹层）。
 *
 * @param params 含 TransactionId 的查询参数
 * @returns 结算流水记录数组
 * @see views/memberManage/gameRecord/components/game-record-list-panel.vue
 */
export async function fetchGameRecordSettleLogApi(params: {
  TransactionId: string;
}) {
  const data = await requestClient.get<null | Record<string, unknown>[]>(
    '/backend/operation/gametransactiondetaillog',
    { params },
  );
  return Array.isArray(data) ? data : [];
}

/**
 * 按订单号拉取三方游戏详情（游戏记录 · 三方详情兜底弹窗）。
 *
 * @param params 含订单号等查询参数
 * @returns 三方详情键值对数组（Name、Type、Value）
 * @see views/memberManage/gameRecord/components/game-record-third-detail-modal.vue
 */
export function fetchGameRecordThirdDetailApi(params: Record<string, unknown>) {
  return requestClient.get<
    Array<{ Name?: string; Type?: string; Value?: unknown }>
  >('/backend/operation/getbyorderid', { params });
}

/**
 * 归一化 EVO 边注明细查询参数（基于游戏记录参数并处理 InviteSite）
 * @param query 前端 EVO 边注筛选/分页参数
 * @returns 经 normalizeGameRecordQuery 处理后的请求参数
 */
function normalizeEvoSideBetQuery(query: EvoSideBetListQuery) {
  const params = normalizeGameRecordQuery(
    query as GameRecordListQuery,
  ) as Record<string, unknown>;
  const inviteSite = params.InviteSite;
  if (Array.isArray(inviteSite)) {
    params.InviteSite = inviteSite.length > 0 ? inviteSite.join(',') : '';
  }
  return params;
}

/**
 * EVO 边注明细列表（会员管理 · EVO 边注明细页主表格及汇总）。
 *
 * @param query 查询参数（玩家、游戏、时间等筛选及分页）
 * @returns EVO 边注行 Items、Pagination 及 MoreItems 汇总
 * @see views/memberManage/evoSidebetDetail/index.vue
 */
export async function fetchEvoSideBetListApi(query: EvoSideBetListQuery) {
  const result = await requestClient.get<
    CloudListResult<EvoSideBetListItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactionevosidebetdetail', {
    params: normalizeEvoSideBetQuery(query),
  });
  return normalizeListResult(result);
}
