import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { mergeRankUsers } from '#/utils/ranking';
import type { RankPlayerRow } from '#/utils/ranking';
import { trimSpace } from '#/utils/string';

/** 充值 / 兑换排行：列表在 Items，金额字段为 SumGold（非 ItemsWin / SumAddGold） */
export interface GamePaymentRankResult {
  Items?: Record<string, unknown>[];
  Users?: Record<string, unknown>[];
}

async function fetchPaymentRankRaw(query: Record<string, unknown>) {
  return requestClient.get<GamePaymentRankResult>(
    '/backend/operation/gamepaymentrank',
    { params: trimSpace(query) },
  );
}

async function fetchWithdrawRankRaw(query: Record<string, unknown>) {
  return requestClient.get<GamePaymentRankResult>(
    '/backend/operation/gamewithdrawrank',
    { params: trimSpace(query) },
  );
}

function toMergedList(data: GamePaymentRankResult) {
  const items = mergeRankUsers(data.Items || [], data.Users || []);
  return {
    Items: items,
    Pagination: { MaxCount: items.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

export async function fetchPayRankListApi(query: Record<string, unknown>) {
  return toMergedList(await fetchPaymentRankRaw(query));
}

export async function fetchWithdrawRankListApi(query: Record<string, unknown>) {
  return toMergedList(await fetchWithdrawRankRaw(query));
}

export async function fetchPayWithdrawRankApi(query: Record<string, unknown>) {
  const [pay, withdraw] = await Promise.all([
    fetchPaymentRankRaw(query),
    fetchWithdrawRankRaw(query),
  ]);
  return {
    outItems: mergeRankUsers(withdraw.Items || [], withdraw.Users || []),
    payItems: mergeRankUsers(pay.Items || [], pay.Users || []),
  };
}
