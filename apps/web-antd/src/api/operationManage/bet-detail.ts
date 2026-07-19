import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerBetDateStatItem,
  PlayerBetListQuery,
  PlayerBetRecordItem,
  PlayerBetSummary,
  PlayerBetVenueStatItem,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

function normalizeBetQuery(query: PlayerBetListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const gameIds = params.GameIds;
  if (Array.isArray(gameIds)) {
    params.GameIds = gameIds.length ? gameIds.join(',') : '';
  }
  const vipLevel = params.VipLevel;
  if (Array.isArray(vipLevel)) {
    params.VipLevel = vipLevel.length ? vipLevel.join(',') : '';
  }
  return params;
}

export function fetchPlayerBetRecordListApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetRecordItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiondetail', {
    params: normalizeBetQuery(query),
  });
}

export function fetchPlayerBetVenueStatApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetVenueStatItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiongametype', {
    params: normalizeBetQuery(query),
  });
}

export function fetchPlayerBetDateStatApi(query: PlayerBetListQuery) {
  return requestClient.get<
    CloudListResult<PlayerBetDateStatItem> & {
      MoreItems?: PlayerBetSummary;
    }
  >('/backend/operation/gametransactiongameday', {
    params: normalizeBetQuery(query),
  });
}
