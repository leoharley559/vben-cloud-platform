import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerAddWithdrawWaterPayload,
  PlayerCreditRecordItem,
  PlayerCreditRecordQuery,
  PlayerDrawWaterItem,
  PlayerEasyRechargeItem,
  PlayerEasyRechargeQuery,
  PlayerGameDetailItem,
  PlayerGameDetailQuery,
  PlayerGameDetailSummary,
  PlayerLogItem,
  PlayerLogQuery,
  PlayerPointsRecordItem,
  PlayerPointsRecordQuery,
  PlayerRebateRecordItem,
  PlayerRebateRecordQuery,
  PlayerRelationItem,
  PlayerRelationQuery,
  PlayerRiskAnalysisGameItem,
  PlayerRiskAnalysisItem,
  PlayerVenueTransferItem,
  PlayerVenueTransferQuery,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

/**
 * 规范化查询参数中的多选数组字段。
 *
 * 先 trim 全部字段，再将指定字段的数组值转为逗号分隔字符串（空数组转为 `''`）。
 *
 * @param query 原始查询对象
 * @param fields 需要数组转字符串的字段名列表
 * @returns 可直接作为 GET params 的对象
 */
function normalizeArrayQuery(query: Record<string, unknown>, fields: string[]) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  for (const field of fields) {
    const value = params[field];
    if (Array.isArray(value)) {
      params[field] = value.length ? value.join(',') : '';
    }
  }
  return params;
}

/**
 * 分页查询玩家游戏投注明细。
 *
 * @param query 玩家 ID、场馆、时间等筛选及分页参数
 * @returns 投注明细 Items、Pagination 及 MoreItems 汇总
 * @see views/operationalManage/playerDetails/components/player-game-info.vue
 */
export function fetchPlayerGameDetailListApi(query: PlayerGameDetailQuery) {
  return requestClient.get<
    CloudListResult<PlayerGameDetailItem> & {
      MoreItems?: PlayerGameDetailSummary;
    }
  >('/backend/playerinfo/gamedetail', {
    params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
      'Reason',
    ]),
  });
}

/**
 * 分页查询玩家场馆转账记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 场馆转账 Items、Pagination 及 Total
 * @see views/operationalManage/playerDetails/components/player-venue-transfer.vue
 */
export function fetchPlayerVenueTransferListApi(
  query: PlayerVenueTransferQuery,
) {
  return requestClient.get<
    CloudListResult<PlayerVenueTransferItem> & {
      Total?: { Total?: number | string };
    }
  >('/backend/playerwallettransferorder/list', {
    params: trimSpace(query),
  });
}

/**
 * 分页查询玩家关联设备/IP 汇总。
 *
 * @param query 玩家 ID 及关联类型等筛选参数
 * @returns 关联记录 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-relation.vue
 */
export function fetchPlayerRelationListApi(query: PlayerRelationQuery) {
  return requestClient.get<CloudListResult<PlayerRelationItem>>(
    '/backend/playerinfo/devicesiptotal',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询玩家返水记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 返水记录 Items、Pagination 及 SumBackWater 汇总
 * @see views/operationalManage/playerDetails/components/player-rebate.vue
 */
export function fetchPlayerRebateListApi(query: PlayerRebateRecordQuery) {
  return requestClient.get<
    CloudListResult<PlayerRebateRecordItem> & {
      SumBackWater?: number | string;
    }
  >('/backend/playerbackwaterrecord/list', {
    params: trimSpace(query),
  });
}

/**
 * 分页查询玩家提款流水/打码记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 打码记录 Items、Pagination 及 WaterDetail
 * @see views/operationalManage/playerDetails/components/player-streaming.vue
 */
export function fetchPlayerDrawWaterListApi(query: Record<string, unknown>) {
  return requestClient.get<
    CloudListResult<PlayerDrawWaterItem> & {
      WaterDetail?: string;
    }
  >('/backend/playerdrawwaterrecord/list', {
    params: trimSpace(query),
  });
}

/**
 * 分页查询玩家信用额度变动记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 信用记录 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/playerDetails/components/player-credit-record.vue
 * @see views/operationalManage/rechargeList/components/credit-record-list.vue
 */
export function fetchPlayerCreditRecordListApi(query: PlayerCreditRecordQuery) {
  return requestClient.get<
    CloudListResult<PlayerCreditRecordItem> & {
      Total?: { TotalAmount?: number | string };
    }
  >('/backend/agentcreditlimittransaction/list', {
    params: trimSpace(query),
  });
}

/**
 * 分页查询玩家 USDT 快捷充值记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 快捷充值 Items、Pagination 及 Total 汇总
 */
export function fetchPlayerEasyRechargeListApi(query: PlayerEasyRechargeQuery) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: { Amount?: number | string };
    }
  >('/backend/playereasyrecharge/list', {
    params: trimSpace(query),
  });
}

/**
 * 调整玩家提款流水系数。
 *
 * @param data 玩家 Id 及流水系数等
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/streaming-add-turnover-modal.vue
 */
export function updatePlayerWithdrawWaterApi(
  data: PlayerAddWithdrawWaterPayload,
) {
  return requestClient.put('/backend/playerinfo/waterfactor', data);
}

/**
 * 重置玩家打码 rollover 状态。
 *
 * @param data OrderIdList 逗号分隔的订单 ID
 * @returns 接口响应
 * @see views/operationalManage/playerDetails/components/player-streaming.vue
 */
export function resetPlayerRolloverApi(data: { OrderIdList: string }) {
  return requestClient.post(
    '/backend/playerdrawwaterrecord/resetrollover',
    data,
  );
}

/**
 * 分页查询玩家积分变动记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 积分记录 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-points.vue
 */
export function fetchPlayerPointsRecordApi(query: PlayerPointsRecordQuery) {
  return requestClient.get<CloudListResult<PlayerPointsRecordItem>>(
    '/backend/rewardsmall/point/recordlist',
    { params: trimSpace(query) },
  );
}

/**
 * 获取玩家风险分析汇总。
 *
 * @param playerId 玩家 ID
 * @returns 风险分析 Items
 * @see views/operationalManage/playerDetails/components/player-risk.vue
 */
export function fetchPlayerRiskAnalysisApi(playerId: number | string) {
  return requestClient.get<CloudListResult<PlayerRiskAnalysisItem>>(
    '/backend/playerinfo/riskanalysis',
    {
      params: { DataSearchType: 2, PlayerId: playerId },
    },
  );
}

/**
 * 获取玩家按场馆维度的风险分析。
 *
 * @param playerId 玩家 ID
 * @returns 按场馆风险分析 Items
 * @see views/operationalManage/playerDetails/components/player-risk.vue
 */
export function fetchPlayerRiskAnalysisGameApi(playerId: number | string) {
  return requestClient.get<CloudListResult<PlayerRiskAnalysisGameItem>>(
    '/backend/playerinfo/riskanalysisgame',
    {
      params: { DataSearchType: 2, PlayerId: playerId },
    },
  );
}

/**
 * 分页查询玩家资料变更操作日志。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns 操作日志 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-logs.vue
 */
export function fetchPlayerActionLogsApi(query: PlayerLogQuery) {
  return requestClient.get<CloudListResult<PlayerLogItem>>(
    '/backend/playerinfo/playerinfolog',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询玩家 AI 助手搜索记录。
 *
 * @param query 玩家 ID、时间等筛选及分页参数
 * @returns AI 搜索记录 Items 与 Pagination
 * @see views/operationalManage/playerDetails/components/player-problem.vue
 */
export function fetchPlayerAiSearchRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/aiassistantsearch/list',
    { params: trimSpace(query) },
  );
}
