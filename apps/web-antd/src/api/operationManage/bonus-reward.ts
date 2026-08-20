import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerBonusRewardItem,
  PlayerBonusRewardQuery,
  PlayerBonusRewardSummary,
} from '#/types/player-detail';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 规范化玩家活动彩金查询参数。
 *
 * 去除首尾空格，并将 BonusType 多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeBonusRewardQuery(query: PlayerBonusRewardQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const bonusType = params.BonusType;
  if (Array.isArray(bonusType)) {
    params.BonusType = bonusType.length > 0 ? bonusType.join(',') : '';
  }
  return params;
}

/**
 * 查询玩家活动彩金/奖励明细列表
 * @param query 筛选条件（玩家、彩金类型、时间范围及分页）
 * @returns 奖励明细列表 Items、Pagination 及 BannerItems 汇总
 * @see views/operationalManage/playerDetails/components/player-bonus-reward.vue
 */
export function fetchPlayerBonusRewardListApi(query: PlayerBonusRewardQuery) {
  return requestClient.get<
    CloudListResult<PlayerBonusRewardItem> & {
      BannerItems?: PlayerBonusRewardSummary;
    }
  >('/backend/activitylogstatistics/listbyplayer', {
    params: normalizeBonusRewardQuery(query),
  });
}
