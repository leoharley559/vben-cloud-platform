import type { PlayerBetListQuery } from '#/types/player-detail';

export interface GameRecordListQuery extends PlayerBetListQuery {
  AppUrl?: Array<string> | string;
  BeginBetGold?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  DevicePlatform?: Array<string> | string;
  EndBetGold?: number | string;
  InviteSite?: Array<number | string> | number | string;
  PackageId?: number | string;
  PlayerStatus?: Array<number | string> | number | string;
  SubGameId?: number | string;
  TagName?: string;
  TimeZone?: string;
  Username?: string;
  /** 仅前端：场馆模版，提交前删除 */
  VenuesTemp?: string[];
  VenueTypes?: Array<string> | string;
}
