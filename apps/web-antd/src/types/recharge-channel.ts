export type RechargeChannelId = number | string;
export type RechargeWireList = string;
export type RechargeStatus = number;
export type RechargeGearsWire = RechargeWireList;
export type RechargeLevelIdsWire = RechargeWireList;
export type RechargePlatformTypeWire = RechargeWireList;
export type RechargeTestChannelWire = RechargeWireList;

export interface RechargePagination {
  [key: string]: unknown;
  MaxCount?: number;
}

export interface RechargeConditions {
  [key: string]: unknown;
  RegTime: number[];
  VipV2: number[];
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
  [key: string]: unknown;
  AllowInput?: number;
  Amount?: number | string;
  Count?: number;
  CustomRate?: number | string;
  ExpirationTime?: number | string;
  Id: RechargeChannelId;
  Index?: number;
  InputMax?: number | string;
  InputMin?: number | string;
  InUsed?: number;
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
}

export interface RechargePayTypeConfig {
  [key: string]: unknown;
  Closed?: number;
  Id: RechargeChannelId;
  IsExpand?: number;
  IsHot?: number;
  Opened?: number;
  PayType: number | string;
  Sort?: number;
  Switch?: number;
}

export interface RechargePayTypeCount {
  [key: string]: unknown;
  Closed?: number;
  Opened?: number;
  PayType: number | string;
}

export interface RechargeChannelListResult {
  [key: string]: unknown;
  Items: RechargeChannelItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
}

/** Updates intentionally retain unknown backend fields from the complete row. */
export interface RechargeChannelUpdatePayload extends RechargeAudienceWireFields {
  [key: string]: unknown;
  Id: RechargeChannelId;
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
  [key: string]: unknown;
  Id: RechargeChannelId;
  ModelName?: string;
}

export interface RechargeQuickTemplatePayload extends Partial<RechargeAudienceWireFields> {
  [key: string]: unknown;
  ModelName: string;
}

export interface RechargeQuickTemplateListResult {
  [key: string]: unknown;
  Items: RechargeQuickTemplate[];
  Pagination?: RechargePagination;
}

export interface RechargePlayerLevelQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  LevelName?: string;
  Page?: number;
  PageSize?: number;
}

export interface RechargePlayerLevel {
  [key: string]: unknown;
  Id: RechargeChannelId;
  LevelName?: string;
}

export interface RechargePlayerLevelListResult {
  [key: string]: unknown;
  Items: RechargePlayerLevel[];
  Pagination: RechargePagination;
}

export interface RechargeChildChannelOption {
  [key: string]: unknown;
  ChannelId: RechargeChannelId;
  ChannelName?: string;
  IsHidden?: number;
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
  [key: string]: unknown;
  AllowInput?: number;
  Bank?: string;
  CardNo?: string;
  Gears?: string;
  Id: RechargeChannelId;
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
}

export interface PrivateCardPayload extends Omit<PrivateCardItem, 'Id'> {
  [key: string]: unknown;
  Hash?: string;
  Id?: RechargeChannelId;
}

export type PrivateCardDetail = PrivateCardItem;

export interface PrivateCardListResult {
  [key: string]: unknown;
  Items: PrivateCardItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
}

export interface RechargeOpenPayload extends RechargeIdPayload {
  Open: RechargeStatus;
}

export interface RechargeSpecializedTotal {
  [key: string]: unknown;
  Closed?: number;
  Opened?: number;
}

export interface RechargeSpecializedTotalResult {
  [key: string]: unknown;
  Items: RechargeSpecializedTotal;
}

export interface UsdtRechargeItem extends RechargeAudienceWireFields {
  [key: string]: unknown;
  AgentId?: RechargeChannelId;
  Agreement?: string;
  AllowInput?: number;
  ChannelAddress?: string;
  DailyLimit?: number | string;
  Id: RechargeChannelId;
  Index?: number;
  InputMax?: number | string;
  InputMin?: number | string;
  NickName?: string;
  Open?: number;
  PayType?: number | string;
  ResetTime?: number | string;
}

export interface UsdtRechargePayload extends Omit<UsdtRechargeItem, 'Id'> {
  [key: string]: unknown;
  Hash?: string;
  Id?: RechargeChannelId;
}

export type UsdtRechargeDetail = UsdtRechargeItem;

export interface UsdtRechargeListResult {
  [key: string]: unknown;
  Items: UsdtRechargeItem[];
  Pagination: RechargePagination;
  Total: RechargePayTypeCount[];
  TypeList: RechargePayTypeConfig[];
}

export interface VoucherCreatePayload {
  [key: string]: unknown;
  ConvertType: number;
  ExchangeAmount: number | string;
  ExchangeCode?: string;
  GenerateQuantity?: number | string;
  Hash?: string;
  Password?: string;
}

export interface VoucherImportPayload {
  ExchangeCode: string;
}

export interface VoucherImportResult {
  [key: string]: unknown;
  Items: string[];
  ItemsExist: string[];
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
  [key: string]: unknown;
  Amount?: number;
  CreateTime?: number;
  DigitalDeliveryInfo?: string;
  EvoucherCodeEncry?: string;
  ItemCount?: number;
  OrderDeliveryStatus?: number;
  OrderEmailStatus?: number;
  OrderStatus?: number | string;
  TradeOrderId?: RechargeChannelId;
}

export interface VoucherRecordListResult {
  [key: string]: unknown;
  Items: VoucherRecordItem[];
  Pagination: RechargePagination;
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
  [key: string]: unknown;
  CallCount?: number;
  CoinDealerId?: RechargeChannelId;
  CoinDealerOnline?: number;
  Conditions?: string;
  Id: RechargeChannelId;
  Index?: number;
  NickName?: string;
  OrderCount?: number;
  Photo?: string;
  Priority?: number | string;
  Status?: number;
  Types?: string;
  Username?: string;
}

export interface VipDealerPayload extends Omit<VipDealerItem, 'Id'> {
  [key: string]: unknown;
  ConfirmPassword?: string;
  Hash?: string;
  Id?: RechargeChannelId;
  Password?: string;
}

export type VipDealerDetail = VipDealerItem;

/** Status changes use the same complete-row PUT endpoint as edits. */
export interface VipDealerStatusPayload extends VipDealerPayload {
  Id: RechargeChannelId;
  Status: RechargeStatus;
}

export interface VipDealerListResult {
  [key: string]: unknown;
  Items: VipDealerItem[];
  Pagination: RechargePagination;
}

export interface AvailableCoinDealer {
  [key: string]: unknown;
  Id: RechargeChannelId;
  nick_name?: string;
  NickName?: string;
  Types?: string;
  Username?: string;
}

export interface AvailableCoinDealerListResult {
  [key: string]: unknown;
  Items: AvailableCoinDealer[];
  Pagination?: RechargePagination;
}

export interface VipDealerOrderMode {
  [key: string]: unknown;
  OrderSwitch?: number;
}

export interface VipDealerOrderModePayload {
  OrderSwitch: number;
}
