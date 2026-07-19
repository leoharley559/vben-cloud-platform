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

export function fetchPlayerRelationListApi(query: PlayerRelationQuery) {
  return requestClient.get<CloudListResult<PlayerRelationItem>>(
    '/backend/playerinfo/devicesiptotal',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerRebateListApi(query: PlayerRebateRecordQuery) {
  return requestClient.get<
    CloudListResult<PlayerRebateRecordItem> & {
      SumBackWater?: number | string;
    }
  >('/backend/playerbackwaterrecord/list', {
    params: trimSpace(query),
  });
}

export function fetchPlayerDrawWaterListApi(query: Record<string, unknown>) {
  return requestClient.get<
    CloudListResult<PlayerDrawWaterItem> & {
      WaterDetail?: string;
    }
  >('/backend/playerdrawwaterrecord/list', {
    params: trimSpace(query),
  });
}

export function fetchPlayerCreditRecordListApi(query: PlayerCreditRecordQuery) {
  return requestClient.get<
    CloudListResult<PlayerCreditRecordItem> & {
      Total?: { TotalAmount?: number | string };
    }
  >('/backend/agentcreditlimittransaction/list', {
    params: trimSpace(query),
  });
}

export function fetchPlayerEasyRechargeListApi(query: PlayerEasyRechargeQuery) {
  return requestClient.get<
    CloudListResult<PlayerEasyRechargeItem> & {
      Total?: { Amount?: number | string };
    }
  >('/backend/playereasyrecharge/list', {
    params: trimSpace(query),
  });
}

export function updatePlayerWithdrawWaterApi(
  data: PlayerAddWithdrawWaterPayload,
) {
  return requestClient.put('/backend/playerinfo/waterfactor', data);
}

export function resetPlayerRolloverApi(data: { OrderIdList: string }) {
  return requestClient.post(
    '/backend/playerdrawwaterrecord/resetrollover',
    data,
  );
}

export function fetchPlayerPointsRecordApi(query: PlayerPointsRecordQuery) {
  return requestClient.get<CloudListResult<PlayerPointsRecordItem>>(
    '/backend/rewardsmall/point/recordlist',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerRiskAnalysisApi(playerId: number | string) {
  return requestClient.get<CloudListResult<PlayerRiskAnalysisItem>>(
    '/backend/playerinfo/riskanalysis',
    {
      params: { DataSearchType: 2, PlayerId: playerId },
    },
  );
}

export function fetchPlayerRiskAnalysisGameApi(playerId: number | string) {
  return requestClient.get<CloudListResult<PlayerRiskAnalysisGameItem>>(
    '/backend/playerinfo/riskanalysisgame',
    {
      params: { DataSearchType: 2, PlayerId: playerId },
    },
  );
}

export function fetchPlayerActionLogsApi(query: PlayerLogQuery) {
  return requestClient.get<CloudListResult<PlayerLogItem>>(
    '/backend/playerinfo/playerinfolog',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerAiSearchRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/aiassistantsearch/list',
    { params: trimSpace(query) },
  );
}
