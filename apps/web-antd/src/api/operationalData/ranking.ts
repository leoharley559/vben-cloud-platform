import type { CloudListResult } from '#/types/operational-data';
import type { GameWinRankResult } from '#/types/operational-data';
import type { RankGameRow, RankPlayerRow } from '#/utils/ranking';

import { requestClient } from '#/api/request';
import { enrichGameRankRows, mergeRankUsers } from '#/utils/ranking';
import { trimSpace } from '#/utils/string';

export type { RankGameRow, RankPlayerRow };

/**
 * 获取玩家输赢排行原始数据（含 ItemsWin / ItemsLose 与 Users）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns ItemsWin、ItemsLose、Users 等原始排行结构
 * @see views/operationalData/ranking/components/win-loss-rank-panel.vue
 */
export async function fetchGameWinRankRawApi(query: Record<string, unknown>) {
  return requestClient.get<GameWinRankResult>(
    '/backend/operation/gamewinrank',
    { params: trimSpace(query) },
  );
}

/**
 * 获取玩家输赢排行，一次请求拆成赢分榜与输分榜（按 SumAddGold 正负过滤，对齐旧站）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns winItems 赢分排行行，loseItems 输分排行行
 * @see views/operationalData/ranking/components/win-loss-rank-panel.vue
 */
export async function fetchWinLoseRankApi(query: Record<string, unknown>) {
  const data = await fetchGameWinRankRawApi(query);
  const users = data.Users || [];
  const winItems = mergeRankUsers(data.ItemsWin || [], users).filter(
    (item) => Number(item.SumAddGold || 0) >= 0,
  );
  const loseItems = mergeRankUsers(data.ItemsLose || [], users).filter(
    (item) => Number(item.SumAddGold || 0) <= 0,
  );
  return { loseItems, winItems };
}

/**
 * 获取玩家赢分排行列表（归一化为 CloudListResult 格式）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 赢分排行行，Pagination.MaxCount 为条目数
 */
export async function fetchWinRankListApi(query: Record<string, unknown>) {
  const { winItems } = await fetchWinLoseRankApi(query);
  return {
    Items: winItems,
    Pagination: { MaxCount: winItems.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

/**
 * 获取玩家输分排行列表（归一化为 CloudListResult 格式）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 输分排行行，Pagination.MaxCount 为条目数
 */
export async function fetchLoseRankListApi(query: Record<string, unknown>) {
  const { loseItems } = await fetchWinLoseRankApi(query);
  return {
    Items: loseItems,
    Pagination: { MaxCount: loseItems.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

/**
 * 获取游戏盈亏排行原始数据（含 ItemsWin / ItemsLose）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns ItemsWin、ItemsLose 等原始游戏排行结构
 * @see views/operationalData/ranking/components/game-rank-panel.vue
 */
export async function fetchRealGameWinRankRawApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<{
    ItemsLose?: Record<string, unknown>[];
    ItemsWin?: Record<string, unknown>[];
  }>('/backend/operation/realgamewinrank', { params: trimSpace(query) });
}

/**
 * 获取游戏盈亏排行，拆成盈利榜与亏损榜并补充游戏名称等展示字段。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns winItems 盈利游戏排行行，loseItems 亏损游戏排行行
 * @see views/operationalData/ranking/components/game-rank-panel.vue
 */
export async function fetchGameProfitLossRankApi(
  query: Record<string, unknown>,
) {
  const data = await fetchRealGameWinRankRawApi(query);
  return {
    loseItems: enrichGameRankRows(data.ItemsLose || []),
    winItems: enrichGameRankRows(data.ItemsWin || []),
  };
}

/**
 * 获取游戏盈利排行列表（归一化为 CloudListResult 格式）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 盈利游戏排行行，Pagination.MaxCount 为条目数
 */
export async function fetchGameProfitRankListApi(
  query: Record<string, unknown>,
) {
  const { winItems } = await fetchGameProfitLossRankApi(query);
  return {
    Items: winItems,
    Pagination: { MaxCount: winItems.length },
  } satisfies CloudListResult<RankGameRow>;
}

/**
 * 获取游戏亏损排行列表（归一化为 CloudListResult 格式）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 亏损游戏排行行，Pagination.MaxCount 为条目数
 */
export async function fetchGameLossRankListApi(query: Record<string, unknown>) {
  const { loseItems } = await fetchGameProfitLossRankApi(query);
  return {
    Items: loseItems,
    Pagination: { MaxCount: loseItems.length },
  } satisfies CloudListResult<RankGameRow>;
}

/**
 * 获取无限代理排行列表。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 无限代理排行行，Pagination 含 MaxCount
 * @see views/operationalData/ranking/components/endless-rank-panel.vue
 */
export async function fetchEndlessRankListApi(query: Record<string, unknown>) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/ranking', { params: trimSpace(query) });
  const items = data.Items || [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}
