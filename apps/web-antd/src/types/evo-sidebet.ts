import type { GameRecordListQuery } from '#/types/game-record';
import type { PlayerBetRecordItem } from '#/types/player-detail';

export interface EvoSideBetListItem extends PlayerBetRecordItem {
  SideBetName?: string;
  SiteName?: string;
  SiteType?: string;
  SubGameId?: number | string;
}

export interface EvoSideBetListQuery extends GameRecordListQuery {
  BeginBetGold?: number | string;
  EndBetGold?: number | string;
  InviteSite?: Array<number | string> | number | string;
  SubGameId?: number | string;
}
