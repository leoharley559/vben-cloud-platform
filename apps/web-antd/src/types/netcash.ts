import type { ChannelId } from '#/types/channel-config';
import type { CloudPagination } from '#/types/operation-manage';

export interface AgencyListItem {
  AccountLevel?: number;
  AccountType?: number;
  CommissionTemplateId?: number;
  CreateTime?: number | string;
  DeveloperName?: string;
  Id?: number | string;
  MaintainerName?: string;
  MobileNumber?: string;
  Name?: string;
  Remark?: string;
  Status?: number;
  TeamName?: string;
  Type?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface AgencyListQuery {
  AlipayAccount?: string;
  BeginTime?: number | string;
  CountBeginTime?: number | string;
  CountEndTime?: number | string;
  DeveloperName?: string;
  EndTime?: number | string;
  LastLoginDevice?: string;
  LastLoginIP?: string;
  IsExp?: boolean;
  MainUsername?: string;
  MaintainerName?: string;
  MobileNumber?: string;
  Page: number;
  PageSize: number;
  ParentAdminId?: number | string;
  RegistDevice?: string;
  RegistIP?: string;
  Sort?: string;
  Status?: number | string;
  TeamName?: string;
  Type?: number | string;
  Username?: string;
  WithdrawAccName?: string;
  WithdrawAccNum?: string;
}

export interface AgencyRegisterItem {
  Approve?: number;
  ApproveName?: string;
  CloneChannelPlanName?: string;
  CreateTime?: number | string;
  DevicePlatform?: string;
  DeveloperName?: string;
  Email?: string;
  Id?: number | string;
  Mobile?: string;
  MobileNumber?: string;
  RegIp?: string;
  RegisterDevice?: string;
  RegisterIP?: string;
  Status?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface AgencyRegisterListQuery {
  Approve?: number | string;
  BeginTime?: number | string;
  Email?: string;
  EndTime?: number | string;
  Mobile?: string;
  Page: number;
  PageSize: number;
  RegIp?: string;
  Status?: number | string;
  Username?: string;
}

export interface SpillManageItem {
  Account?: string;
  AgreeDesc?: string;
  ApplyPlatform?: string;
  ApproveName?: string;
  ApproveTime?: number | string;
  CreateTime?: number | string;
  Desc?: string;
  Id?: number | string;
  Image?: string | string[];
  LoginAccount?: string;
  OwnerAccount?: string;
  OwnerChannelId?: number | string;
  PackageId?: number | string;
  PackageName?: string;
  PlayerId?: number | string;
  RealPlatform?: string;
  RegisterTime?: number | string;
  Status?: number;
  Url?: string;
  VipLevel?: number | string;
  [key: string]: unknown;
}

export interface SpillManageListResult {
  Items: SpillManageItem[];
  Pagination: CloudPagination;
  Total: number;
}

export interface SpillManageListQuery {
  Account?: string;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Status?: number | string;
  TimeBegin?: number | string;
  TimeEnd?: number | string;
  VipLevel?: number | string;
}

export interface SpillManageAuditPayload {
  Desc: string;
  Id: number | string;
  Status: number;
}

export interface HelpCenterItem {
  AdminId?: number | string;
  Content?: string;
  Deleted?: number;
  Id?: number | string;
  LangGroupId?: number | string;
  LangText?: HelpCenterLangText;
  Sort?: number;
  Status?: number | string;
  Tag?: string;
  [key: string]: unknown;
}

export interface HelpCenterLangTextItem {
  Content?: string;
  LangGroupId?: number | string;
  Tag?: string;
  [key: string]: unknown;
}

export type HelpCenterLangText =
  | HelpCenterLangTextItem[]
  | null
  | Record<string, HelpCenterLangTextItem>
  | string;

export interface HelpCenterListQuery {
  LangGroupId?: number | string;
  Page?: number;
  PageSize?: number;
  Status?: number | string;
}

export interface PromotionConfItem {
  CreateTime?: number | string;
  Id?: number | string;
  Sort?: number;
  Type?: number | string;
  Value?: string;
  [key: string]: unknown;
}

export interface ExtensionMaterialItem {
  CreateTime?: number | string;
  Id?: number | string;
  Image?: string;
  ImagePath?: string;
  LangGroupId?: number | string;
  LanguageName?: string;
  PackageId?: number | string;
  PackageName?: string;
  SizeId?: number | string;
  SizeName?: string;
  Sort?: number;
  Status?: number | string;
  ThemeId?: number | string;
  ThemeName?: string;
  [key: string]: unknown;
}

export interface ExtensionMaterialListQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  LangGroupId?: number | string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  SizeId?: number | string;
  Sort?: string;
  Status?: number | string;
  ThemeId?: number | string;
}

export interface PromotionMaterialPayload {
  Id?: number | string;
  Image?: string;
  ImagePath?: string;
  LangGroupId?: number | string;
  NewSize?: string;
  NewTheme?: string;
  PackageId?: number | string;
  SizeId?: number | string;
  Status?: number | string;
  ThemeId?: number | string;
  createSize?: '1' | '2';
  createTheme?: '1' | '2';
}

export type NetcashMutationResult =
  | null
  | Record<string, unknown>
  | undefined;

export interface RecordQueryBaseQuery {
  AdminAccount?: string;
  AgentAccount?: string;
  ApplyBeginTime?: number | string;
  ApplyEndTime?: number | string;
  BeginTime?: number | string;
  BonusTitle?: string;
  BonusType?: number[] | string;
  DataSearchType?: number;
  EndTime?: number | string;
  FinishBeginTime?: number | string;
  FinishEndTime?: number | string;
  IsExp?: boolean;
  IsWater?: number;
  LoginAccount?: string;
  OperatorAccount?: string;
  OperatorAccountType?: number;
  OperatorRemark?: string;
  OperatorRemarkType?: number;
  OrderId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
  Status?: number;
  TransferEndTime?: number | string;
  TransferStartTime?: number | string;
  TransferType?: number | string;
  Username?: string;
  VipLevel?: number;
  WalletType?: number | string;
}

export interface RecordQueryTotal {
  AddGoldTotal?: number;
  BackWaterTotal?: number;
  RealAmountTotal?: number;
  SumBonus?: number;
  TotalAdjustAmount?: number;
  TotalAfterAdjustAmount?: number;
  TotalBeforeAdjustAmount?: number;
  TotalReal?: number;
  [key: string]: number | undefined;
}

export interface RecordQueryListResult<
  T,
  TTotal extends RecordQueryTotal = RecordQueryTotal,
> {
  Items: T[];
  Pagination: CloudPagination;
  Total: TTotal;
}

export interface RecordBaseItem {
  AgentAccount?: string;
  AgentName?: string;
  CreateTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  [key: string]: unknown;
}

export interface RecordAdjustItem extends RecordBaseItem {
  Amount?: number;
  HandleType?: string;
}

export interface RecordDepositItem extends RecordBaseItem {
  PayType?: number;
  RealAmount?: number;
}

export interface RecordLoginItem extends RecordBaseItem {
  Ip?: string;
  IpName?: string;
}

export interface RecordWithdrawItem extends RecordBaseItem {
  AccountNum?: string;
  AccountType?: number;
  RealAmount?: number;
}

export interface RecordBackwaterItem extends RecordBaseItem {
  BackWater?: number;
}

export interface RecordGameItem extends RecordBaseItem {
  AddGold?: number;
  GameType?: number | string;
  LogId?: number | string;
}

export interface RecordBonusItem {
  ApplyAccount?: string;
  ApplyNote?: string;
  ApplyTime?: number | string;
  Bonus?: number;
  BonusTitle?: string;
  BonusType?: number;
  Draw?: number;
  FailTime?: number | string;
  FinishTime?: number | string;
  IsWater?: number;
  LoginAccount?: string;
  Operator?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerStatus?: number;
  ReviewNote?: string;
  SendType?: number;
  Status?: number;
  Username?: string;
  VipLevel?: number;
  [key: string]: unknown;
}

export interface RecordTransactionItem {
  AdjustAmount?: number;
  AdjustAmountAft?: number;
  AdjustAmountBef?: number;
  AdminAccount?: string;
  OrderId?: string;
  ReviewNote?: string;
  TransferType?: number;
  UpdateTime?: number | string;
  WalletType?: number;
  [key: string]: unknown;
}

export interface NetcashListQuery {
  Page: number;
  PageSize: number;
  [key: string]: unknown;
}

export interface NetcashListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: CloudPagination;
  Total?: Record<string, number>;
}

export interface CommissionListQuery {
  ActivityUserNumMax?: number | string;
  ActivityUserNumMin?: number | string;
  AgentAccount?: string;
  AgentStatus?: number | string;
  AmountMax?: number | string;
  AmountMin?: number | string;
  BeginTime?: number | string;
  CommissionType?: number | string;
  DataSearchType?: number;
  Desc?: string;
  DeveloperName?: string;
  EndTime?: number | string;
  IsExp?: boolean;
  IsLastMonthBetWin?: number;
  IsMeetSettlementReq?: number;
  IsMulti: number;
  IsSettlement?: number | string;
  IsTeam: number;
  MainUsername?: string;
  MaintainerName?: string;
  PackageIds?: string;
  Page: number;
  PageSize: number;
  PayoutBeginTime?: number | string;
  PayoutEndTime?: number | string;
  ReportMonth?: string;
  SettlementBeginTime?: number | string;
  SettlementEndTime?: number | string;
  SettlementName?: string;
  TeamName?: string;
  Type?: number | string;
}

export interface CommissionRow {
  Id?: number | string;
  IsMulti?: number;
  IsSettlement?: number;
  IsTeam?: number;
  ReportMonth?: string;
  Username?: string;
  [key: string]: unknown;
}

export type CommissionListResult = NetcashListResult<CommissionRow>;

export interface PlatformCreditInfo {
  Credit?: number;
  Dkcredit?: number;
  Items?: PlatformCreditInfo;
  [key: string]: unknown;
}

export interface PlatformCreditApplyRecord {
  AdjustAmount?: number;
  ApplyAccount?: string;
  ApplyTime?: number | string;
  CreateAdminId?: number | string;
  FinishAccount?: string;
  FinishTime?: number | string;
  Id?: number | string;
  OrderId?: number | string;
  Status?: number;
  WalletType?: number;
  [key: string]: unknown;
}

export interface PlatformNetCashLog {
  AdjustAmount?: number;
  AdjustAmountAft?: number;
  AdjustAmountBef?: number;
  OrderId?: number | string;
  ReviewNote?: string;
  UpdateTime?: number | string;
  WalletType?: number;
  [key: string]: unknown;
}

export interface PlatformCreditApplyRecordQuery extends NetcashListQuery {
  AdjustType?: number | string;
  AgentType: 1;
  BeginApplyTime?: number | string;
  EndApplyTime?: number | string;
  Status: number | string;
  WalletType?: number | string;
}

export interface PlatformNetCashLogQuery extends NetcashListQuery {
  AdjustType?: number | string;
  AgentType: 1;
  TransferEndTime?: number | string;
  TransferStartTime?: number | string;
  TransferType: 3;
  WalletType?: number | string;
}

export interface PlatformCreditApplyPayload {
  AdjustAmount: number;
  Hash: string;
  WalletType: 2 | 3;
}

export interface PlatformCreditReviewPayload {
  FinishNote?: string;
  Hash: string;
  Ids: string;
}

export interface CloneChannelPlanQuery {
  ChannelId?: string;
  PackageId?: string;
}

export interface CloneChannelPlanItem {
  ChannelId?: string;
  Id?: ChannelId;
  IsHidden?: number;
  Name?: string;
  PackageId?: string;
  [key: string]: unknown;
}

export interface CloneChannelPlanResult {
  Items?: CloneChannelPlanItem[] | null;
  Pagination?: CloudPagination;
}

export interface CloneChannelPlanPayload {
  ChannelId: string;
  Id?: ChannelId;
  PlanName: string;
}

export interface LogoGroupOption {
  Id?: ChannelId;
  LogoGroupId?: ChannelId;
  Name?: string;
  TemplateName?: string;
  [key: string]: unknown;
}

export interface LogoGroupListResult {
  Items?: LogoGroupOption[] | null;
  PackageLogo?: null | { LogoGroupId?: ChannelId };
  [key: string]: unknown;
}

export interface AgentDomainRow {
  AdminId?: ChannelId;
  AdminStatus?: number;
  ChannelId?: ChannelId;
  ChannelName?: string;
  CreateTime?: number | string;
  HandlerName?: string;
  HandlerTime?: number | string;
  Id?: ChannelId;
  Name?: string;
  NetCashDomain?: string;
  NetCashH5Domain?: string;
  PackageId?: ChannelId | string;
  Sort?: number;
  Status?: number;
  Type?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface AgentDomainQuery extends NetcashListQuery {
  AdminStatus?: number | string;
  BeginTime?: number | string;
  ChannelId?: '' | ChannelId;
  EndTime?: number | string;
  NetCashDomain?: string;
  NetCashH5Domain?: string;
  Sort?: string;
  Status?: number | string;
  Type?: number | string;
  Username?: string;
}

export interface BonusManageItem {
  Amount?: number;
  ApplyDesc?: string;
  ApplyName?: string;
  Approve?: number;
  ApproveDesc?: string;
  ApproveName?: string;
  ApproveTime?: number | string;
  BonusType?: number;
  ChangeDesc?: string;
  CreateAdminId?: number | string;
  CreateTime?: number | string;
  Id?: number | string;
  OrderId?: number | string;
  RealAmount?: number;
  Username?: string;
  WalletType?: number;
  [key: string]: unknown;
}

export interface BonusAdminItem {
  AdminId?: number | string;
  Amount?: number;
  Type?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface BonusBatchResult {
  Count?: number;
  FailCount?: number;
  FailItems?: Array<{
    AdminId?: number | string;
    Amount?: number;
    Msg?: string;
    Username?: string;
  }>;
  SuccessCount?: number;
}

export interface ProxyGroupItem {
  GroupName?: string;
  Id: number | string;
  Level?: number;
  List?: ProxyGroupItem[];
  ParentId?: number | string;
  ParentTree?: string;
  Sort?: number;
  [key: string]: unknown;
}

export interface ProxyGroupingListItem {
  DeveloperName?: string;
  Group?: number | string;
  GroupCreateTime?: number | string;
  Id: number | string;
  Name?: string;
  Username?: string;
  [key: string]: unknown;
}
