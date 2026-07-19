export type RechargeChannelId = number | string;
export type RechargeWireList = string;
export type RechargeStatus = number;
export type RechargeGearsWire = RechargeWireList;
export type RechargeLevelIdsWire = RechargeWireList;
export type RechargePlatformTypeWire = RechargeWireList;
export type RechargeTestChannelWire = RechargeWireList;

export interface RechargePagination {
  MaxCount?: number;
  [key: string]: unknown;
}

export interface RechargeConditions {
  RegTime: number[];
  VipV2: number[];
  [key: string]: unknown;
}

/** Serialized fields used by the legacy backend. */
export interface RechargeAudienceWireFields {
  Conditions?: string;
  Gears?: RechargeGearsWire;
  LevelIds?: RechargeLevelIdsWire;
  PlatformType?: RechargePlatformTypeWire;
  TestChannel?: RechargeTestChannelWire;
}

export interface RechargeParsedAudienceFields {
  Conditions: RechargeConditions;
  Gears: Array<number | string>;
  LevelIds: RechargeChannelId[];
  PlatformType: number[];
  TestChannel: RechargeChannelId[];
}

export interface RechargeChannelQuery {
  Keyword?: string;
  OnShelf?: number | string;
  Page: number;
  PageSize: number;
  PayType?: number | string;
  Sort?: string;
}

export interface RechargeChannelItem extends RechargeAudienceWireFields {
  Id: RechargeChannelId;
  AllowInput?: number;
  Amount?: number | string;
  Count?: number;
  CustomRate?: number | string;
  ExpirationTime?: number | string;
  InUsed?: number;
  Index?: number;
  InputMax?: number | string;
  InputMin?: number | string;
  NickName?: string;
  OnShelf?: number;
  Params?: string;
  PayType?: number | string;
  Priority?: number | string;
  Rate?: number | string;
  RateType?: number;
  ShowName?: string;
  SuccessCount?: number;
  SuccessWarnOpen?: number;
  SuccessWarnRate?: number | string;
  [key: string]: unknown;
}

export interface RechargePayTypeConfig {
  Id: RechargeChannelId;
  IsExpand?: number;
  IsHot?: number;
  PayType: number | string;
  Sort?: number;
  Switch?: number;
  Closed?: number;
  Opened?: number;
  [key: string]: unknown;
}

export interface RechargePayTypeCount {
  Closed?: number;
  Opened?: number;
  PayType: number | string;
  [key: string]: unknown;
}

export interface RechargeChannelListResult {
  Items: RechargeChannelItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
  [key: string]: unknown;
}

/** Updates intentionally retain unknown backend fields from the complete row. */
export interface RechargeChannelUpdatePayload extends RechargeAudienceWireFields {
  Id: RechargeChannelId;
  [key: string]: unknown;
}

export interface RechargeIdPayload {
  Id: RechargeChannelId;
}

export interface RechargeUsedPayload extends RechargeIdPayload {
  InUsed: RechargeStatus;
}

export interface RechargeShelfPayload extends RechargeIdPayload {
  OnShelf: RechargeStatus;
}

export interface RechargeResetPayload extends RechargeIdPayload {
  [key: string]: unknown;
}

export interface RechargeParamsPayload extends RechargeIdPayload {
  Params: string;
}

export interface RechargeRefreshPayload {
  PayType: number | string;
}

export interface RechargeSortPayload {
  Ids: RechargeWireList;
}

export interface RechargePayTypeStatusPayload extends RechargeIdPayload {
  Switch: RechargeStatus;
}

export interface RechargePayTypeUpdatePayload extends RechargeIdPayload {
  IsExpand: RechargeStatus;
  IsHot: RechargeStatus;
}

export interface RechargeQuickTemplate extends Partial<RechargeAudienceWireFields> {
  Id: RechargeChannelId;
  ModelName?: string;
  [key: string]: unknown;
}

export interface RechargeQuickTemplatePayload extends Partial<RechargeAudienceWireFields> {
  ModelName: string;
  [key: string]: unknown;
}

export interface RechargeQuickTemplateListResult {
  Items: RechargeQuickTemplate[];
  Pagination?: RechargePagination;
  [key: string]: unknown;
}

export interface RechargePlayerLevelQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  LevelName?: string;
  Page?: number;
  PageSize?: number;
}

export interface RechargePlayerLevel {
  Id: RechargeChannelId;
  LevelName?: string;
  [key: string]: unknown;
}

export interface RechargePlayerLevelListResult {
  Items: RechargePlayerLevel[];
  Pagination: RechargePagination;
  [key: string]: unknown;
}

export interface RechargeChildChannelOption {
  ChannelId: RechargeChannelId;
  ChannelName?: string;
  IsHidden?: number;
  [key: string]: unknown;
}

export interface RechargeSpecializedQuery {
  Keyword?: string;
  OnShelf?: number | string;
  Page?: number;
  PageSize?: number;
  PayType?: number | string;
  Sort?: string;
}

export interface PrivateCardItem extends RechargeAudienceWireFields {
  Id: RechargeChannelId;
  AllowInput?: number;
  Bank?: string;
  CardNo?: string;
  Gears?: string;
  Index?: number;
  InputMax?: number | string;
  InputMin?: number | string;
  Name?: string;
  NickName?: string;
  Open?: number;
  PayType?: number | string;
  Priority?: number | string;
  Rate?: number | string;
  ShowName?: string;
  [key: string]: unknown;
}

export interface PrivateCardPayload extends Omit<PrivateCardItem, 'Id'> {
  Id?: RechargeChannelId;
  Hash?: string;
  [key: string]: unknown;
}

export type PrivateCardDetail = PrivateCardItem;

export interface PrivateCardListResult {
  Items: PrivateCardItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
  [key: string]: unknown;
}

export interface RechargeOpenPayload extends RechargeIdPayload {
  Open: RechargeStatus;
}

export interface RechargeSpecializedTotal {
  Closed?: number;
  Opened?: number;
  [key: string]: unknown;
}

export interface RechargeSpecializedTotalResult {
  Items: RechargeSpecializedTotal;
  [key: string]: unknown;
}

export interface UsdtRechargeItem extends RechargeAudienceWireFields {
  Id: RechargeChannelId;
  AgentId?: RechargeChannelId;
  Agreement?: string;
  AllowInput?: number;
  ChannelAddress?: string;
  DailyLimit?: number | string;
  Index?: number;
  InputMax?: number | string;
  InputMin?: number | string;
  NickName?: string;
  Open?: number;
  PayType?: number | string;
  ResetTime?: number | string;
  [key: string]: unknown;
}

export interface UsdtRechargePayload extends Omit<UsdtRechargeItem, 'Id'> {
  Id?: RechargeChannelId;
  Hash?: string;
  [key: string]: unknown;
}

export type UsdtRechargeDetail = UsdtRechargeItem;

export interface UsdtRechargeListResult {
  Items: UsdtRechargeItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
  [key: string]: unknown;
}

export interface VoucherCreatePayload {
  ConvertType: number;
  ExchangeAmount: number | string;
  ExchangeCode?: string;
  GenerateQuantity?: number | string;
  Hash?: string;
  Password?: string;
  [key: string]: unknown;
}

export interface VoucherImportPayload {
  ExchangeCode: string;
}

export interface VoucherImportResult {
  Items: string[];
  ItemsExist: string[];
  [key: string]: unknown;
}

export interface VoucherRecordQuery {
  Amount?: number | string;
  BeginTime?: number | string;
  DigitalDeliveryInfo?: string;
  EndTime?: number | string;
  EvoucherCodeEncry?: string;
  OrderDeliveryStatus?: number | string;
  OrderEmailStatus?: number | string;
  OrderStatus?: number | string;
  Page: number;
  PageSize: number;
  TradeOrderId?: RechargeChannelId;
}

export interface VoucherRecordItem {
  Amount?: number;
  CreateTime?: number;
  DigitalDeliveryInfo?: string;
  EvoucherCodeEncry?: string;
  ItemCount?: number;
  OrderDeliveryStatus?: number;
  OrderEmailStatus?: number;
  OrderStatus?: number | string;
  TradeOrderId?: RechargeChannelId;
  [key: string]: unknown;
}

export interface VoucherRecordListResult {
  Items: VoucherRecordItem[];
  Pagination: RechargePagination;
  [key: string]: unknown;
}

export interface VipDealerQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  Keyword?: string;
  Page: number;
  PageSize: number;
  Sort?: string;
  Status?: number | string;
  Username?: string;
}

export interface VipDealerItem extends RechargeAudienceWireFields {
  Id: RechargeChannelId;
  CallCount?: number;
  CoinDealerId?: RechargeChannelId;
  CoinDealerOnline?: number;
  Conditions?: string;
  Index?: number;
  NickName?: string;
  OrderCount?: number;
  Photo?: string;
  Priority?: number | string;
  Status?: number;
  Types?: string;
  Username?: string;
  [key: string]: unknown;
}

export interface VipDealerPayload extends Omit<VipDealerItem, 'Id'> {
  Id?: RechargeChannelId;
  ConfirmPassword?: string;
  Hash?: string;
  Password?: string;
  [key: string]: unknown;
}

export type VipDealerDetail = VipDealerItem;

/** Status changes use the same complete-row PUT endpoint as edits. */
export interface VipDealerStatusPayload extends VipDealerPayload {
  Id: RechargeChannelId;
  Status: RechargeStatus;
}

export interface VipDealerListResult {
  Items: VipDealerItem[];
  Pagination: RechargePagination;
  [key: string]: unknown;
}

export interface AvailableCoinDealer {
  Id: RechargeChannelId;
  NickName?: string;
  Types?: string;
  Username?: string;
  nick_name?: string;
  [key: string]: unknown;
}

export interface AvailableCoinDealerListResult {
  Items: AvailableCoinDealer[];
  Pagination?: RechargePagination;
  [key: string]: unknown;
}

export interface VipDealerOrderMode {
  OrderSwitch?: number;
  [key: string]: unknown;
}

export interface VipDealerOrderModePayload {
  OrderSwitch: number;
}
