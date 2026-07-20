import type { CloudPagination } from '#/types/operation-manage';

export interface PromoterTotalItem {
  AdminId?: number | string;
  SumAgentPayMoney?: number;
  SumCountAlipayNum?: number;
  SumCountPhoneNum?: number;
  SumDayWater?: number;
  SumDevice?: number;
  SumPayMoney?: number;
  SumWithdrawMoney?: number;
}

export interface PromoterListItem {
  AdminId?: number | string;
  ChildMaxCommissionRate?: number;
  ChildMinCommissionRate?: number;
  CommissionRate?: number;
  ContactInf?: string;
  CreateTime?: number | string;
  HasChildren?: boolean;
  Id?: number | string;
  IsOneTui?: boolean;
  IsTeamAccount?: number;
  Name?: string;
  Note?: string;
  PayPeriod?: number | string;
  ProfitCommissionRate?: number;
  RoleDataField?: string | { HaveFunction?: string };
  SettlePrice?: number;
  SettleType?: number;
  Status?: number;
  TeamType?: number;
  Total?: number;
  Username?: string;
  children?: PromoterListItem[];
  hasChildren?: boolean;
}

export interface PromoterListQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  Keyword?: string;
  Name?: string;
  Page: number;
  PageSize: number;
  ParentId?: number | string;
  SettleType?: number | string;
  Sort?: string;
  Status?: number | string;
  Username?: string;
}

export interface PromoterListResult {
  Config?: { Domain?: string };
  Items?: PromoterListItem[];
  ItemsTotal?: PromoterTotalItem[];
  Pagination?: CloudPagination;
}

export interface PromoterDetail extends PromoterListItem {
  ConfirmPassword?: string;
  Password?: string;
  SettleRate?: number | string;
}

export interface PromoterPayload extends Record<string, unknown> {
  Id?: number | string;
  Status?: number;
}

export interface PromoterTeamPayload {
  AccountId?: number | string;
  ChildMaxCommissionRate?: number;
  ChildMinCommissionRate?: number;
  CommissionRate?: number;
  PayPeriod?: number | string;
  ProfitCommissionRate?: number;
  TeamType?: number;
}

export interface PromoterCostPayload {
  CostOfPaymentOdd?: number;
  CostOfWithdrawOdd?: number;
}

export interface PromoterDomainPayload {
  Domain?: number | string;
}

export interface DomainListItem {
  Domain?: string;
  Id?: number | string;
}

export interface TeamQueryItem {
  AdminId?: number | string;
  AdminName?: string;
  AdminUsername?: string;
  CommissionRate?: number;
  SumNextBetGameMoney?: number;
  SumNextGameTax?: number;
  SumNextIncomeMoney?: number;
  SumNextPayMergerMoney?: number;
  SumNextPayMergerNum?: number;
  SumNextReg?: number;
  SumSelfBetGameMoney?: number;
  SumSelfGameTax?: number;
  SumSelfIncomeMoney?: number;
  SumSelfPayMergerMoney?: number;
  SumSelfPayMergerNum?: number;
  SumSelfReg?: number;
}

export interface TeamQueryListQuery {
  AdminId?: number | string;
  AdminUsername?: string;
  BeginTime?: number | string;
  EndTime?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface BrokerageSetItem {
  AdminId?: number | string;
  AgentId?: number | string;
  children?: BrokerageSetItem[];
  Desc?: string;
  GameId?: number | string;
  Id?: number | string;
  Name?: string;
  ParentId?: number | string;
  Rate?: number;
  Type?: string;
  resType?: number;
}

export interface BrokerageSetListQuery {
  GameId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  PlayerName?: string;
  Sort?: string;
}

export interface BrokerageSetPayload {
  Desc?: string;
  GameId?: number | string;
  Hash?: string;
  Id?: number | string;
  Rate?: number;
}

export interface BrokerageBatchPayload {
  Desc?: string;
  GameId?: Array<number | string>;
  Rate?: number;
}

export interface PromoteDataBaseQuery {
  AdminIds?: Array<number | string> | number | string;
  BeginTime?: string;
  ChannelIds?: Array<number | string> | number | string;
  EndTime?: string;
  TemplateId?: number | string;
}

export interface ChannelDataItem {
  NowDate?: string;
  RegisterDate?: string;
  RowKey?: string;
  SumAgentPayMoney?: number;
  SumAgentPayNum?: number;
  SumCostMoney?: number;
  SumLogin?: number;
  SumPayMergerMoney?: number;
  SumPayMergerNum?: number;
  SumPayMoney?: number;
  SumPayNum?: number | string;
  SumReg?: number;
  SumRegDevice?: number;
  SumWithdrawMoney?: number;
}

export interface ChannelDataResult {
  Items?: ChannelDataItem[];
  ItemsCost?: Array<{ ReportDate?: string; SumCostMoney?: number }>;
  ItemsTotal?: ChannelDataItem[];
}

export interface DropChangeItem {
  app_login_count?: number;
  channel_id?: number | string;
  device_count?: number;
  download_count?: number;
  page_view?: number;
  pay_count?: number;
  player_count?: number;
  unique_page_view?: number;
}

export interface DropChangeResult {
  Item?: DropChangeItem[];
  Page?: { MaxCount?: number };
}

export interface DropChangeListQuery extends PromoteDataBaseQuery {
  Page: number;
  PageSize: number;
}

export interface InvalidUserData {
  CountDeviceNum?: number;
  CountNum0?: number;
  CountNum1?: number;
  CountNum3?: number;
  CountRegNum?: number;
}

export interface HandRecordItem {
  ChannelId?: number | string;
  ClickNum?: number;
  CostMoney?: number;
  DownNum?: number;
  ExposureNum?: number;
  Id?: number | string;
  Ip?: number;
  ReportDate?: string;
  TemplateId?: number | string;
  Uv?: number;
}

export interface HandRecordListQuery extends PromoteDataBaseQuery {
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface HandRecordPayload {
  ChannelId?: number | string;
  ClickNum?: number;
  CostMoney?: number;
  DownNum?: number;
  ExposureNum?: number;
  Id?: number | string;
  Hash?: string;
  Ip?: number;
  ReportDate?: string;
  TemplateId?: number | string;
  Uv?: number;
}

export interface LandingPageItem {
  Background?: string;
  BackgroundStyle?: number | string;
  CreateTime?: number | string;
  Description?: string;
  DownloadMode?: number;
  DownloadTime?: number | string;
  Id?: number | string;
  Name?: string;
}

export interface LandingPageListQuery {
  FilterKey?: string;
  FilterValue?: string;
  Keyword?: string;
  Name?: string;
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface LandingPagePayload {
  Background?: string;
  BackgroundStyle?: number | string;
  Description?: string;
  DownloadMode?: number;
  DownloadTime?: number | string;
  Id?: number | string;
  Name?: string;
}

export interface LandingResourceItem {
  Id?: number | string;
  PictureUrl?: string;
}

export interface CloseManageItem {
  AddMoney?: number;
  CreateTime?: number | string;
  Desc?: string;
  MoneyType?: number;
  NewMoney?: number;
}

export interface CloseManageListQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  MoneyType?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface CloseManageListResult {
  Items?: CloseManageItem[];
  MoreItems?: {
    FreezeMoney?: number;
    Money?: number;
    PayRate?: Array<{
      MaxAmount?: number;
      MaxMoney?: number;
      MinAmount?: number;
      MinMoney?: number;
      PayType?: number;
      Rate?: number;
      ServiceRate?: number;
      Type?: number;
    }>;
  };
  Pagination?: CloudPagination;
}

export interface WithdrawAccountItem {
  Account?: string;
  AccountType?: number;
  BankName?: string;
  Hash?: string;
  Id?: number | string;
  RealName?: string;
  VerifyCode?: string;
}

export interface WithdrawPayload {
  Account: string;
  AccountNo: number | string;
  GetMoney: number | string;
  Hash: string;
  PrivatePassword: string;
}

export interface CloseOrderItem {
  AdminName?: string;
  AdminUserName?: string;
  BankAccount?: string;
  BankRealName?: string;
  BankType?: number;
  CreateTime?: number | string;
  Desc?: string;
  Id?: number | string;
  Money?: number;
  OrderId?: string;
  ServiceCharge?: number;
  Status?: number;
  UpdateAdminId?: number | string;
  UpdateAdminName?: string;
  UpdateFinishAdminName?: string;
  UpdateFinishTime?: number | string;
  UpdateTime?: number | string;
}

export interface CloseOrderListQuery {
  AdminUserName?: string;
  BeginTime?: number | string;
  EndTime?: number | string;
  Keyword?: string;
  OrderId?: string;
  Page: number;
  PageSize: number;
  Sort?: string;
  Status?: number | string;
}

export interface CloseOrderStatusSummary {
  Status?: number;
  SumNum?: number;
  SumNumRate?: number;
}

export interface CloseOrderListResult {
  Items?: CloseOrderItem[];
  MoreItems?: CloseOrderStatusSummary[];
  Pagination?: CloudPagination;
}

export interface CloseOrderFinishPayload {
  Desc: string;
  Id: number | string;
  IsAccept: number;
  IsYourSure: boolean;
}

export interface TimeshareHourItem {
  Hours?: number;
  ReportDay?: string;
  SumAgentPayMoney?: number;
  SumAgentPayNum?: number;
  SumDevice?: number;
  SumLogin?: number;
  SumPayMoney?: number;
  SumPayNum?: number;
  SumReg?: number;
  SumWithdrawMoney?: number;
  SumWithdrawNum?: number;
}

export interface TimeshareDataQuery {
  AdminId?: number | string;
  BeginTime?: string;
  ChannelId?: number | string;
  EndTime?: string;
}

export interface ChannelRecoupItem {
  FirstPayNum?: number;
  RegNum?: number;
  RegisterPeriod?: string;
  [key: string]: unknown;
}

export interface ChannelRecoupListQuery {
  AdminSearch?: string;
  AdminSearchType?: number;
  BeginTime?: string;
  ChannelSearch?: string;
  ChannelSearchType?: number;
  EndTime?: string;
  IsTotal?: boolean;
  ReportType?: number;
  Type?: number;
}

export interface ExchangeRateItem {
  Country?: string;
  Id?: number | string;
  Rate?: number;
}

export interface TeamDailySummary {
  NextBetGameMoney?: number;
  NextGameTax?: number;
  NextIncomeMoney?: number;
  NextPayMergerMoney?: number;
  NextProfitIncomeMoney?: number;
  NextReg?: number;
  NextWithdrawMoney?: number;
  SelfBetGameMoney?: number;
  SelfGameTax?: number;
  SelfIncomeMoney?: number;
  SelfPayMergerMoney?: number;
  SelfProfitIncomeMoney?: number;
  SelfReg?: number;
  SelfWithdrawMoney?: number;
  SumNextBetGameMoney?: number;
  SumNextGameTax?: number;
  SumNextIncomeMoney?: number;
  SumNextPayMergerMoney?: number;
  SumNextProfitIncomeMoney?: number;
  SumNextReg?: number;
  SumNextWithdrawMoney?: number;
  SumSelfBetGameMoney?: number;
  SumSelfGameTax?: number;
  SumSelfIncomeMoney?: number;
  SumSelfPayMergerMoney?: number;
  SumSelfProfitIncomeMoney?: number;
  SumSelfReg?: number;
  SumSelfWithdrawMoney?: number;
}

export interface TeamDailyHistoryItem {
  ReportDay?: string;
  SumNextBetGameMoney?: number;
  SumNextGameTax?: number;
  SumNextIncomeMoney?: number;
  SumNextPayMergerMoney?: number;
  SumNextProfitIncomeMoney?: number;
  SumNextReg?: number;
  SumNextWithdrawMoney?: number;
  SumSelfBetGameMoney?: number;
  SumSelfGameTax?: number;
  SumSelfIncomeMoney?: number;
  SumSelfPayMergerMoney?: number;
  SumSelfProfitIncomeMoney?: number;
  SumSelfReg?: number;
  SumSelfWithdrawMoney?: number;
}

export interface TeamDailyResult {
  BannerItems?: TeamDailySummary;
  HistoryItems?: TeamDailyHistoryItem[];
  TodayItems?: TeamDailySummary;
}

export interface TeamDailyListQuery {
  AdminId?: number | string;
  BeginTime?: number | string;
  EndTime?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
  TeamType?: number;
}

export interface SteamerGroupItem {
  Id?: number | string;
  IsDefault?: boolean;
  TypeName?: string;
}

export interface SteamerAdminTeamItem {
  Checked?: boolean;
  Id?: number | string;
  TypeName?: string;
}

export interface SteamerDirectGroupResult {
  CanQingLiu?: boolean;
  Teams?: SteamerAdminTeamItem[];
}

export interface PromoterFormPayload extends Record<string, unknown> {
  ConfirmPassword?: string;
  ContactInf?: string;
  Hash?: string;
  Id?: number | string;
  Name?: string;
  Note?: string;
  Password?: string;
  QingLiu?: boolean;
  RoleDataField?: string;
  SettlePrice?: number | string;
  SettleRate?: number | string;
  SettleType?: number;
  Status?: number;
  TeamIds?: Array<number | string>;
  Username?: string;
}
