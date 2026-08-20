import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerBetDateStatItem,
  PlayerBetListQuery,
  PlayerBetRecordItem,
  PlayerBetSummary,
  PlayerBetVenueStatItem,
} from '#/types/player-detail';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 规范化投注明细查询参数。
 *
 * 去除首尾空格，并将 GameIds、VipLevel 等多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeBetQuery(query: PlayerBetListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const gameIds = params.GameIds;
  if (Array.isArray(gameIds)) {
    params.GameIds = gameIds.length > 0 ? gameIds.join(',') : '';
  }
  const vipLevel = params.VipLevel;
  if (Array.isArray(vipLevel)) {
    params.VipLevel = vipLevel.length > 0 ? vipLevel.join(',') : '';
  }
  return params;
}

/**
 * 查询玩家投注明细列表
 * @param query 筛选条件（玩家、游戏、时间范围及分页）
 * @returns 投注明细列表 Items、Pagination 及 MoreItems 汇总
 * @see views/operationalManage/playerDetails/components/player-bet-record.vue
 */
export function fetchPlayerBetRecordListApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetRecordItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiondetail', {
    params: normalizeBetQuery(query),
  });
}

/**
 * 查询玩家按游戏场馆聚合的投注统计
 * @param query 筛选条件（玩家、游戏、时间范围及分页）
 * @returns 场馆维度统计 Items、Pagination 及 MoreItems 汇总
 * @see views/operationalManage/playerDetails/components/player-bet-venue-stats.vue
 */
export function fetchPlayerBetVenueStatApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetVenueStatItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiongametype', {
    params: normalizeBetQuery(query),
  });
}

/**
 * 查询玩家按日期聚合的投注统计
 * @param query 筛选条件（玩家、游戏、时间范围及分页）
 * @returns 日期维度统计 Items、Pagination 及 MoreItems 汇总
 * @see views/operationalManage/playerDetails/components/player-bet-date-stats.vue
 */
export function fetchPlayerBetDateStatApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetDateStatItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiongameday', {
    params: normalizeBetQuery(query),
  });
}
