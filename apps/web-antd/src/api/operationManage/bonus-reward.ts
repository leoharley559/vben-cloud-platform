import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerBonusRewardItem,
  PlayerBonusRewardQuery,
  PlayerBonusRewardSummary,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

function normalizeBonusRewardQuery(query: PlayerBonusRewardQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const bonusType = params.BonusType;
  if (Array.isArray(bonusType)) {
    params.BonusType = bonusType.length ? bonusType.join(',') : '';
  }
  return params;
}

export function fetchPlayerBonusRewardListApi(query: PlayerBonusRewardQuery) {
  return requestClient.get<
    CloudListResult<PlayerBonusRewardItem> & {
      BannerItems?: PlayerBonusRewardSummary;
    }
  >('/backend/activitylogstatistics/listbyplayer', {
    params: normalizeBonusRewardQuery(query),
  });
}
