export interface PlayerBasicInfo {
  [key: string]: unknown;
  BanRemark?: string;
  BindPhone?: string;
  ChannelId?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
  DataFlag?: number;
  DevicePlatform?: string;
  DialingCode?: string;
  Email?: string;
  Gold?: number | string;
  InviteCode?: string;
  InviterLoginAccount?: string;
  LastLoginTime?: number | string;
  LoginAccount?: string;
  Online?: boolean;
  PackageName?: string;
  PhoneNo?: string;
  PlayerId?: number | string;
  PlayerLevelName?: string;
  PromoterUserName?: string;
  RealName?: string;
  RegIp?: string;
  Status?: number;
  VipLevel?: number | string;
}

export interface PlayerWalletItem {
  [key: string]: unknown;
  Balance?: number | string;
  GameId?: number | string;
  gameName?: string;
  Result?: number;
  UnlockWater?: number | string;
}

export interface PlayerWalletListResult {
  Gold?: number | string;
  Items?: PlayerWalletItem[];
}

export interface PlayerLoginIpRecord {
  [key: string]: unknown;
  AppVersion?: string;
  ChannelId?: number | string;
  ChannelName?: string;
  Date?: number | string;
  DeviceId?: string;
  DeviceModel?: string;
  Ip?: string;
  IpName?: string;
  LoginPlatform?: string;
  SystemVersion?: string;
}

export interface PlayerLoginStatItem {
  [key: string]: unknown;
  DeviceId?: string;
  DeviceTotal?: number | string;
  Ip?: string;
  IpName?: string;
  Total?: number | string;
}

export interface PlayerLoginQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  Keyword?: string;
  LType?: '1' | '2' | number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
}

export interface PlayerGoldPeriodItem {
  [key: string]: unknown;
  BetGold?: number | string;
  BetWater?: number | string;
  ChangeGold?: number | string;
  Recharged?: number | string;
  RedGold?: number | string;
  ReportDay?: string;
  ValidWater?: number | string;
  WinGold?: number | string;
  Withdraw?: number | string;
}

export interface PlayerGoldPeriodTotal {
  [key: string]: unknown;
  SumBetGold?: number | string;
  SumBetWater?: number | string;
  SumChangeGold?: number | string;
  SumRecharged?: number | string;
  SumRedGold?: number | string;
  SumValidWater?: number | string;
  SumWinGold?: number | string;
  SumWithdraw?: number | string;
}

export interface PlayerGoldChangeItem {
  [key: string]: unknown;
  Reason?: number | string;
  Total?: number | string;
}

export interface PlayerSettleItem {
  [key: string]: unknown;
  GameId?: number | string;
  RoomId?: number | string;
  Total?: number | string;
}

export interface PlayerGoldQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  Keyword?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
}

export interface PlayerAdjustListItem {
  [key: string]: unknown;
  AdminUserName?: string;
  Amount?: number | string;
  Approve?: number;
  ApproveName?: string;
  ApproveRemark?: string;
  ApproveTime?: number | string;
  ChannelId?: number | string;
  ChannelName?: string;
  CreateAdminId?: number | string;
  CreateTime?: number | string;
  Done?: number;
  HandleDesc?: string;
  HandlerName?: string;
  HandleType?: number;
  Id?: number | string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Reason?: number;
  Water?: number | string;
  WaterAmount?: number | string;
  WaterType?: number;
}

export interface PlayerAdjustListQuery {
  AdminUserName?: string;
  Approve?: number | string;
  ApproveBeginTime?: number | string;
  ApproveEndTime?: number | string;
  ApproveName?: string;
  BeginTime?: number | string;
  ChannelId?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  DataSearchType?: number;
  Done?: Array<number | string> | number | string;
  EndTime?: number | string;
  HandlerName?: string;
  HandleType?: number | string;
  IsApprove?: number;
  IsExp?: boolean;
  Keyword?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  PlayerName?: string;
  Reason?: number | string;
  WaterType?: number | string;
  WaterTypeIncDec?: Array<number | string> | number | string;
}

export interface PlayerBetListQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  GameIds?: Array<number | string> | number | string;
  IsBetTrade?: number | string;
  LoginAccount?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  RoundId?: string;
  SelectTimeType?: number;
  SettleCount?: number | string;
  Sort?: string;
  Status?: number | string;
  SumAll?: number;
  TransactionId?: string;
  Username?: string;
  VipLevel?: Array<number | string> | number | string;
}

export interface PlayerBetRecordItem {
  [key: string]: unknown;
  BetGold?: number | string;
  CurrentVipLevel?: number | string;
  GameId?: number | string;
  GameType?: number | string;
  IsBetTrade?: number;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerStatus?: number | string;
  RoundId?: string;
  SettleCount?: number;
  SettlementTime?: number | string;
  Status?: number | string;
  TagName?: string;
  TotalBetGold?: number | string;
  TransactionId?: string;
  TransactionTime?: number | string;
  Username?: string;
  ValidWater?: number | string;
  VipLevel?: number | string;
  WinGold?: number | string;
}

export interface PlayerBetVenueStatItem {
  [key: string]: unknown;
  Count?: number | string;
  GameType?: number | string;
  SumBetGold?: number | string;
  SumTotalBetGold?: number | string;
  SumValidWater?: number | string;
  SumWinGold?: number | string;
}

export interface PlayerBetDateStatItem {
  [key: string]: unknown;
  Count?: number | string;
  ReportDay?: string;
  SumBetGold?: number | string;
  SumTotalBetGold?: number | string;
  SumValidWater?: number | string;
  SumWinGold?: number | string;
}

export interface PlayerBetSummary {
  [key: string]: unknown;
  Count?: number | string;
  SumBetGold?: number | string;
  SumTotalBetGold?: number | string;
  SumValidWater?: number | string;
  SumWinGold?: number | string;
}

export interface PlayerBonusRewardItem {
  [key: string]: unknown;
  ApplyAccount?: string;
  ApplyNote?: string;
  ApplyTime?: number | string;
  Bonus?: number | string;
  BonusTitle?: string;
  BonusType?: number;
  Draw?: number | string;
  FailTime?: number | string;
  FinishTime?: number | string;
  IsWater?: number;
  Operator?: string;
  OrderId?: string;
  ReviewNote?: string;
  SendType?: number;
  Status?: number;
  WaterAmount?: number | string;
  WaterReward?: number | string;
  WaterType?: number;
}

export interface PlayerBonusRewardQuery {
  BeginTime?: number | string;
  BonusType?: Array<number | string> | number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  Keyword?: string;
  OrderStatus?: number;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
}

export interface PlayerBonusRewardSummary {
  [key: string]: unknown;
  SumPerformance?: number | string;
  SumRecharge?: number | string;
  SumReward?: number | string;
}

export interface PlayerGameDetailQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  LogId?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Reason?: Array<number | string> | number | string;
  Sort?: string;
}

export interface PlayerGameDetailItem {
  [key: string]: unknown;
  AddGold?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
  ExInfo?: Record<string, unknown> | string;
  GameId?: number | string;
  LogId?: string;
  LoginAccount?: string;
  NewGold?: number | string;
  OldGold?: number | string;
  PackageName?: string;
  Reason?: number | string;
  Remark?: string;
  Username?: string;
}

export interface PlayerGameDetailSummary {
  [key: string]: unknown;
  SumAddGold?: number | string;
}

export interface PlayerVenueTransferQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  InGameId?: number | string;
  IsExp?: boolean;
  OrderId?: string;
  OutGameId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  State?: number | string;
  Type?: number | string;
}

export interface PlayerVenueTransferItem {
  [key: string]: unknown;
  Amount?: number | string;
  CreateTime?: number | string;
  GameId?: number | string;
  OrderId?: string;
  State?: number | string;
  Type?: number | string;
}

export interface PlayerRelationQuery {
  CreateTime?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
  Type?: number;
}

export interface PlayerRelationItem {
  [key: string]: unknown;
  DeviceId?: string;
  DevicePlatform?: string;
  Ip?: string;
  IsBlacklist?: number | string;
  LoginCount?: number | string;
  PlayerCount?: number | string;
  SumRecharge?: number | string;
  SumWithdraw?: number | string;
}

export interface PlayerRebateRecordQuery {
  AwardStatus?: number;
  AwardTimeBegin?: number | string;
  AwardTimeEnd?: number | string;
  DataSearchType?: number;
  OrderId?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
}

export interface PlayerRebateRecordItem {
  [key: string]: unknown;
  AwardStatus?: number;
  AwardTime?: number | string;
  AwardType?: number;
  BackWater?: number | string;
  CreateTime?: number | string;
  OrderId?: string;
}

export interface PlayerDrawWaterItem {
  [key: string]: unknown;
  BillSubType?: number;
  BillType?: number;
  CreateTime?: number | string;
  CreateTimeMicroUnix?: number | string;
  CurrentDrawWater?: number | string;
  DrawWater?: number | string;
  DrawWaterStatus?: number;
  OrderId?: string;
  ProcessTime?: number | string;
  RequireWater?: number | string;
}

export interface PlayerDrawWaterSummary {
  [key: string]: unknown;
  CurrentTotInCompletedDrawWater?: number | string;
  SelectedGamesInCompletedDrawWater?: Record<string, number | string>;
  SelectedGameTypesInCompletedDrawWater?: Record<string, number | string>;
  TotAllGamesInCompletedDrawWater?: number | string;
  TotalSelectedGamesInCompletedDrawWater?: number | string;
  TotalSelectedGameTypesInCompletedDrawWater?: number | string;
}

export interface PlayerCreditRecordQuery {
  AccountName?: string;
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  IsBO?: number;
  IsExp?: boolean;
  OrderId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerAccount?: string;
  PlayerAccountId?: number | string;
  PlayerInfo?: number;
  ReferenceId?: string;
  Sort?: string;
  WalletType?: number | string;
}

export interface PlayerCreditRecordItem {
  [key: string]: unknown;
  AdminAccount?: string;
  Amount?: number | string;
  ChannelName?: string;
  PackageName?: string;
  ReferenceAccount?: string;
  ReferenceId?: string;
  Remarks?: string;
  Status?: number;
  UpdateTime?: number | string;
  VipLevel?: number | string;
  WalletType?: number;
  WithdrawWaterMultiply?: number | string;
}

export interface PlayerEasyRechargeQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  GameOrderId?: string;
  IsExp?: boolean;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PayType?: number;
  PlayerId?: number | string;
  Sort?: string;
  Status?: number | string;
}

export interface PlayerEasyRechargeItem {
  [key: string]: unknown;
  Amount?: number | string;
  Bank?: string;
  CardNo?: string;
  CheckerName?: string;
  CreateTime?: number | string;
  FinTime?: number | string;
  GameOrderId?: string;
  Id?: number | string;
  ImageUrl?: string;
  LoginAccount?: string;
  Name?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerName?: string;
  RealName?: string;
  SendAmount?: number | string;
  Status?: number;
}

export interface EasyRechargeListTotal {
  Amount?: number | string;
  FailAmount?: number | string;
  PayNum?: number | string;
  SumAmount?: number | string;
  SumSendAmount?: number | string;
}

export interface PlayerAddWithdrawWaterPayload {
  AddType: number;
  PlayerId: number | string;
  WaterType: number;
  WaterValList?: string;
  WithdrawWaterFactor: number | string;
}

export interface PlayerPointsRecordQuery {
  ApplyTimeBegin?: number | string;
  ApplyTimeEnd?: number | string;
  Full?: boolean;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  PointType?: number;
}

export interface PlayerPointsRecordItem {
  [key: string]: unknown;
  ApplyTime?: number | string;
  BonusType?: number;
  OrderId?: string;
  PlayerPoint?: number | string;
  Point?: number | string;
  PointType?: number;
}

export interface PlayerRiskAnalysisItem {
  [key: string]: unknown;
  Content?: string;
  ExtInfo?: unknown;
  RiskWarnLevel?: number;
  Type?: number;
}

export interface PlayerRiskAnalysisGameItem {
  [key: string]: unknown;
  BetGold?: number | string;
  GameId?: number | string;
  RiskWarnLevel?: number;
  WinGold?: number | string;
}

export interface PlayerLogQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Sort?: string;
  Type?: number | string;
  Username?: string;
}

export interface PlayerLogItem {
  [key: string]: unknown;
  ActionType?: number | string;
  CreateTime?: number | string;
  HandlerName?: string;
  Remark?: string;
}

export interface PlayerDetailTabConfig {
  key: string;
  label: string;
  permission: number;
}

export const PLAYER_DETAIL_TABS: PlayerDetailTabConfig[] = [
  { key: 'profile', label: '玩家概况', permission: 10_407 },
  { key: 'wallet', label: '钱包', permission: 10_408 },
  { key: 'coin', label: '金币详情', permission: 10_409 },
  { key: 'bet', label: '注单详情', permission: 10_411 },
  { key: 'coinStats', label: '金币统计', permission: 10_412 },
  { key: 'login', label: '登录信息', permission: 10_413 },
  { key: 'rechargeWithdraw', label: '充提记录', permission: 10_414 },
  { key: 'venueTransfer', label: '场馆转账', permission: 12_092 },
  { key: 'adjust', label: '调整记录', permission: 12_097 },
  { key: 'bonus', label: '红利信息', permission: 10_415 },
  { key: 'rebate', label: '返水信息', permission: 11_609 },
  { key: 'streaming', label: '流水信息', permission: 12_936 },
  { key: 'points', label: '积分信息', permission: 13_412 },
  { key: 'relation', label: '关联号详情', permission: 10_416 },
  { key: 'problem', label: '问题纪录', permission: 11_865 },
  { key: 'risk', label: '风控分析', permission: 12_377 },
  { key: 'logs', label: '操作日志', permission: 13_313 },
];
