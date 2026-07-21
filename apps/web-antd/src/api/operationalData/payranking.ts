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

/**
 * 请求充值排行原始数据（未合并 Users）。
 *
 * @param query 查询参数（日期、渠道、包体等，会 trim 空格）
 * @returns Items 排行行与 Users 玩家信息
 */
async function fetchPaymentRankRaw(query: Record<string, unknown>) {
  return requestClient.get<GamePaymentRankResult>(
    '/backend/operation/gamepaymentrank',
    { params: trimSpace(query) },
  );
}

/**
 * 请求兑换排行原始数据（未合并 Users）。
 *
 * @param query 查询参数（日期、渠道、包体等，会 trim 空格）
 * @returns Items 排行行与 Users 玩家信息
 */
async function fetchWithdrawRankRaw(query: Record<string, unknown>) {
  return requestClient.get<GamePaymentRankResult>(
    '/backend/operation/gamewithdrawrank',
    { params: trimSpace(query) },
  );
}

/**
 * 合并排行 Items 与 Users，并归一化为 CloudListResult。
 *
 * @param data 充值/兑换排行原始响应
 * @returns Items 为合并后的排行行，Pagination.MaxCount 为条目数
 */
function toMergedList(data: GamePaymentRankResult) {
  const items = mergeRankUsers(data.Items || [], data.Users || []);
  return {
    Items: items,
    Pagination: { MaxCount: items.length },
  } satisfies CloudListResult<RankPlayerRow>;
}

/**
 * 获取充值排行列表（合并 Users 后归一化为 CloudListResult）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 充值排行行（金额字段 SumGold），Pagination.MaxCount 为条目数
 */
export async function fetchPayRankListApi(query: Record<string, unknown>) {
  return toMergedList(await fetchPaymentRankRaw(query));
}

/**
 * 获取兑换排行列表（合并 Users 后归一化为 CloudListResult）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns Items 兑换排行行（金额字段 SumGold），Pagination.MaxCount 为条目数
 */
export async function fetchWithdrawRankListApi(query: Record<string, unknown>) {
  return toMergedList(await fetchWithdrawRankRaw(query));
}

/**
 * 并行获取充值与兑换排行，拆成充值榜与兑换榜（对齐旧站充兑 Tab）。
 * @param query 查询参数（日期、渠道、包体等筛选条件）
 * @returns payItems 充值排行行，outItems 兑换排行行
 * @see views/operationalData/ranking/components/pay-rank-panel.vue
 * @see views/operationalData/payranking/index.vue
 */
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
