import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { GameRecordListQuery } from '#/types/game-record';
import type {
  EvoSideBetListItem,
  EvoSideBetListQuery,
} from '#/types/evo-sidebet';
import type {
  PlayerBetRecordItem,
  PlayerBetSummary,
} from '#/types/player-detail';
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

function normalizeGameRecordQuery(query: GameRecordListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const gameIds = params.GameIds;
  if (Array.isArray(gameIds)) {
    params.GameIds = gameIds.length ? gameIds.join(',') : '';
  }
  const vipLevel = params.VipLevel;
  if (Array.isArray(vipLevel)) {
    params.VipLevel = vipLevel.length ? vipLevel.join(',') : '';
  }
  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }
  const inviteSite = params.InviteSite;
  if (Array.isArray(inviteSite)) {
    params.InviteSite = inviteSite.length ? inviteSite.join(',') : '';
  }
  const playerStatus = params.PlayerStatus;
  if (Array.isArray(playerStatus)) {
    params.PlayerStatus = playerStatus.length ? playerStatus.join(',') : '';
  }
  const venueTypes = params.VenueTypes;
  if (Array.isArray(venueTypes)) {
    params.VenueTypes = venueTypes.length ? venueTypes.join(',') : '';
  }
  const appUrl = params.AppUrl;
  if (Array.isArray(appUrl)) {
    params.AppUrl = appUrl.length ? appUrl.join(',') : '';
  }
  const devicePlatform = params.DevicePlatform;
  if (Array.isArray(devicePlatform)) {
    params.DevicePlatform = devicePlatform.length
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

/** 导出 pageId=35 */
export function exportGameRecordListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/operation/gametransactiondetailexcel',
    { params: normalizeGameRecordQuery(params as GameRecordListQuery) },
  );
}

/** 已结算状态弹层：结算流水 */
export async function fetchGameRecordSettleLogApi(params: {
  TransactionId: string;
}) {
  const data = await requestClient.get<Record<string, unknown>[] | null>(
    '/backend/operation/gametransactiondetaillog',
    { params },
  );
  return Array.isArray(data) ? data : [];
}

/** 三方详情兜底 */
export function fetchGameRecordThirdDetailApi(params: Record<string, unknown>) {
  return requestClient.get<
    Array<{ Name?: string; Type?: string; Value?: unknown }>
  >('/backend/operation/getbyorderid', { params });
}

function normalizeEvoSideBetQuery(query: EvoSideBetListQuery) {
  const params = normalizeGameRecordQuery(
    query as GameRecordListQuery,
  ) as Record<string, unknown>;
  const inviteSite = params.InviteSite;
  if (Array.isArray(inviteSite)) {
    params.InviteSite = inviteSite.length ? inviteSite.join(',') : '';
  }
  return params;
}

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
