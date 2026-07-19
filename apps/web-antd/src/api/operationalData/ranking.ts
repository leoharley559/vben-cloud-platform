import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import type { GameWinRankResult } from '#/types/operational-data';
import { enrichGameRankRows, mergeRankUsers } from '#/utils/ranking';
import type { RankGameRow, RankPlayerRow } from '#/utils/ranking';
import { trimSpace } from '#/utils/string';

export type { RankGameRow, RankPlayerRow };

export async function fetchGameWinRankRawApi(query: Record<string, unknown>) {
  return requestClient.get<GameWinRankResult>(
    '/backend/operation/gamewinrank',
    { params: trimSpace(query) },
  );
}

/** 输赢排行：一次请求拆成赢分 / 输分（按 SumAddGold 正负过滤，对齐旧站） */
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

export async function fetchWinRankListApi(query: Record<string, unknown>) {
  const { winItems } = await fetchWinLoseRankApi(query);
  return {
    Items: winItems,
    Pagination: { MaxCount: winItems.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

export async function fetchLoseRankListApi(query: Record<string, unknown>) {
  const { loseItems } = await fetchWinLoseRankApi(query);
  return {
    Items: loseItems,
    Pagination: { MaxCount: loseItems.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

export async function fetchRealGameWinRankRawApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<{
    ItemsLose?: Record<string, unknown>[];
    ItemsWin?: Record<string, unknown>[];
  }>('/backend/operation/realgamewinrank', { params: trimSpace(query) });
}

export async function fetchGameProfitLossRankApi(
  query: Record<string, unknown>,
) {
  const data = await fetchRealGameWinRankRawApi(query);
  return {
    loseItems: enrichGameRankRows(data.ItemsLose || []),
    winItems: enrichGameRankRows(data.ItemsWin || []),
  };
}

export async function fetchGameProfitRankListApi(
  query: Record<string, unknown>,
) {
  const { winItems } = await fetchGameProfitLossRankApi(query);
  return {
    Items: winItems,
    Pagination: { MaxCount: winItems.length },
  } satisfies CloudListResult<RankGameRow>;
}

export async function fetchGameLossRankListApi(query: Record<string, unknown>) {
  const { loseItems } = await fetchGameProfitLossRankApi(query);
  return {
    Items: loseItems,
    Pagination: { MaxCount: loseItems.length },
  } satisfies CloudListResult<RankGameRow>;
}

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
