export interface CloudPagination {
  CurrPage?: number;
  MaxCount?: number;
  MaxPageCount?: number;
  Page?: number;
  PageSize?: number;
}

export interface CloudListResult<T> {
  Items?: T[];
  Pagination?: CloudPagination;
  Total?: Record<string, unknown>;
}

export interface PlayerListQuery {
  Bank?: string;
  BeginTime?: number | string;
  BindPhone?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  DataSearchType?: number;
  DeviceId?: string;
  Email?: string;
  EndTime?: number | string;
  Filters?: string;
  FirstPayBeginTime?: number | string;
  FirstPayEndTime?: number | string;
  InviterLoginAccount?: string;
  LastDevice?: string;
  LastIp?: string;
  LoginAccount?: string;
  Online?: boolean;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PhoneNo?: string;
  PlayerIdsStr?: string;
  PlayerLevelId?: number | string;
  PlayerPassword?: string;
  Promoter?: string;
  RealName?: string;
  RegIp?: string;
  Sort?: string;
  Status?: Array<number | string> | number | string;
  TagName?: string;
  VipLevel?: number | string;
}

export interface PlayerListItem {
  [key: string]: unknown;
  AccountType?: number | string;
  ApiLoginAccount?: string;
  BanRemark?: string;
  BindPhone?: number | string;
  ChannelId?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
  DataFlag?: number;
  DeviceId?: string;
  DevicePlatform?: number | string;
  Email?: string;
  FirstPayMoney?: number | string;
  FirstPayTime?: number | string;
  Gold?: number | string;
  InviterLoginAccount?: string;
  InviteSite?: string;
  LastBlockTime?: number;
  LastIp?: string;
  LastLoginTime?: number | string;
  LastTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PhoneNo?: string;
  PlayerId?: number | string;
  PlayerLevelId?: number | string;
  PlayerLevelName?: string;
  PlayerName?: string;
  PromoterUserName?: string;
  RealName?: string;
  Recharged?: number | string;
  RegIp?: string;
  Status?: number;
  TagId?: string;
  TagName?: string;
  VipLevel?: number | string;
  WalletBalance?: number | string;
  WithdrawGold?: number | string;
}

export interface RechargeListQuery {
  AmountMax?: number | string;
  AmountMin?: number | string;
  AmountType?: number;
  BeginTime?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  GameOrderId?: string;
  LoginAccount?: string;
  NickName?: string;
  OrderId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: string;
  Promoter?: string;
  Sort?: string;
  Status?: number | string;
  TimeType?: number;
}

export interface RechargeListItem {
  [key: string]: unknown;
  Amount?: number | string;
  ChannelName?: string;
  CreateAdminName?: string;
  CreateTime?: number | string;
  FinishTime?: number | string;
  FirstTrialName?: string;
  HandleType?: number;
  Id?: number | string;
  LoginAccount?: string;
  NickName?: string;
  OrderId?: string;
  PackageName?: string;
  PayType?: number | string;
  PlayerId?: number | string;
  Process?: number | string;
  RealAmount?: number | string;
  RelatedOrderId?: string;
  ShowName?: string;
  Status?: number;
  VipLevel?: number | string;
}

export interface WithdrawListQuery {
  AccountNum?: string;
  BeginTime?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  EndTime?: number | string;
  GameOrderId?: string;
  HandlerName?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: string;
  RealName?: string;
  Reserve?: number;
  RiskAuditorName?: string;
  /** 风控状态筛选（挂起订单等，对齐旧站 RiskStatus） */
  RiskStatus?: number | string;
  SelectTimeType?: number;
  ShowName?: string;
  Sort?: string;
  WithdrawStatus?: number | string;
}

export interface WithdrawListItem {
  [key: string]: unknown;
  AccountBank?: string;
  AccountNum?: string;
  AccountType?: number | string;
  AgentWithdrawId?: number | string;
  Amount?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
  FinishTime?: number | string;
  HandlerName?: string;
  Id: number | string;
  LoginAccount?: string;
  NotifyResult?: number;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Process?: number;
  RealAmount?: number | string;
  RealName?: string;
  ReceivedStatus?: number;
  RefundScore?: number;
  Remark?: string;
  RiskAuditorId?: number | string;
  RiskAuditorName?: string;
  RiskStatus?: number;
  SendTime?: number | string;
  ShowName?: string;
  Status?: number;
  VipLevel?: number | string;
}

export interface RechargeLimitConfigItem {
  Duration?: number;
  Id?: number | string;
  Limit?: number;
  Vip?: number;
}

export interface RechargeCancelStatsItem {
  CancelReason?: string;
  Proportion?: number | string;
  SumCount?: number | string;
}

export interface RechargeBlackPlayerItem {
  [key: string]: unknown;
  BeginTime?: number | string;
  CreateTime?: number | string;
  DeviceId?: string;
  EndTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  Operator?: string;
  PackageName?: string;
  PayType?: string;
  ProhibitedTime?: number | string;
  Recharged?: number | string;
  RegTime?: number | string;
  Remark?: string;
}

export interface RechargeBlackDeviceItem {
  [key: string]: unknown;
  CreateTime?: number | string;
  DeviceId?: string;
  DisableLoginPlayer?: number | string;
  Id?: number | string;
  Operator?: string;
  PayType?: string;
  Remark?: string;
}

export interface SelfCheckListItem {
  [key: string]: unknown;
  Amount?: number | string;
  CompleteDateTime?: number | string;
  CreateTime?: number | string;
  GameOrderId?: string;
  GameOrderIdOrigin?: string;
  LoginAccount?: string;
  NickName?: string;
  OrderId?: string;
  PackageName?: string;
  PaymentUrlImages?: string;
  PayType?: number;
  PlayerId?: number | string;
  RealAmount?: number | string;
  ReviewName?: string;
  ReviewRemark?: string;
  ShowName?: string;
  Status?: number;
  TakerDateTime?: number | string;
  TakerName?: string;
  WaitingTime?: number | string;
}

export interface SelfReviewVisitItem {
  [key: string]: unknown;
  AppType?: string;
  CreateTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  VipLevel?: number | string;
}
