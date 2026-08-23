import type { ChannelId } from '#/types/channel-config';
import type { CloudPagination } from '#/types/operation-manage';

/** 代理返水单行（场馆维度） */
export interface AgentFanDianLine {
  id?: number | string;
  name?: string;
  /** 存储可能是百分比数值（2.6）或小数比例（0.026） */
  rebate?: number | string;
  type?: string;
}

/** 代理返水单等级：grade_S / grade_A ... */
export interface AgentFanDianGrade {
  earnestMoney?: number | string;
  effectiveFlow?: number | string;
  gameConfigList?: AgentFanDianLine[];
  name?: string;
}

export type AgentFanDianConfig = Record<string, AgentFanDianGrade>;

export interface AgencyListItem {
  [key: string]: unknown;
  AccountLevel?: number;
  AccountType?: number;
  AdminId?: number | string;
  /** 游戏返水配置，接口下发 JSON 字符串 */
  AgentFanDianConfig?: AgentFanDianConfig | string;
  AlgorithmTemplateId?: number | string;
  AlgorithmTemplateName?: string;
  ApiFeeTemplateId?: number | string;
  ApiFeeTemplateName?: string;
  CommissionRateDiff?: number;
  CommissionTemplateId?: number;
  CreateTime?: number | string;
  DeveloperName?: string;
  Id?: number | string;
  LastLoginAddress?: string;
  LastLoginIp?: string;
  LowerAgent?: number;
  MainAdminId?: number | string;
  MaintainerName?: string;
  MainUsername?: string;
  Members?: number;
  MobileNumber?: string;
  Name?: string;
  PackageId?: number | string;
  ParentAdminId?: number | string;
  RegAddress?: string;
  RegIp?: string;
  Remark?: string;
  RemarkOnDeactivation?: string;
  SendCommissionType?: number;
  SettlementType?: number;
  Status?: number;
  SumActiveStatus?: number;
  SumBetValidMoney?: number;
  SumPayMoney?: number;
  SumWinGold?: number | string;
  SumWithDrawMoney?: number;
  TeamName?: string;
  Type?: number;
  Username?: string;
}

export interface AgencyListQuery {
  AlipayAccount?: string;
  BeginTime?: number | string;
  CountBeginTime?: number | string;
  CountEndTime?: number | string;
  DeveloperName?: string;
  EndTime?: number | string;
  IsExp?: boolean;
  LastLoginDevice?: string;
  LastLoginIP?: string;
  MaintainerName?: string;
  MainUsername?: string;
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
  [key: string]: unknown;
  Approve?: number;
  ApproveName?: string;
  CloneChannelPlanName?: string;
  CreateTime?: number | string;
  DeveloperName?: string;
  DevicePlatform?: string;
  Email?: string;
  Id?: number | string;
  Mobile?: string;
  MobileNumber?: string;
  RegIp?: string;
  RegisterDevice?: string;
  RegisterIP?: string;
  Status?: number;
  Username?: string;
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
  [key: string]: unknown;
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
  [key: string]: unknown;
  AdminId?: number | string;
  Content?: string;
  Deleted?: number;
  Id?: number | string;
  LangGroupId?: number | string;
  LangText?: HelpCenterLangText;
  Sort?: number;
  Status?: number | string;
  Tag?: string;
}

export interface HelpCenterLangTextItem {
  [key: string]: unknown;
  Content?: string;
  LangGroupId?: number | string;
  Tag?: string;
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
  [key: string]: unknown;
  CreateTime?: number | string;
  Id?: number | string;
  Sort?: number;
  Type?: number | string;
  Value?: string;
}

export interface ExtensionMaterialItem {
  [key: string]: unknown;
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
  createSize?: '1' | '2';
  createTheme?: '1' | '2';
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
}

export type NetcashMutationResult = null | Record<string, unknown> | undefined;

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
  [key: string]: number | undefined;
  AddGoldTotal?: number;
  BackWaterTotal?: number;
  RealAmountTotal?: number;
  SumBonus?: number;
  TotalAdjustAmount?: number;
  TotalAfterAdjustAmount?: number;
  TotalBeforeAdjustAmount?: number;
  TotalReal?: number;
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
  [key: string]: unknown;
  AgentAccount?: string;
  AgentName?: string;
  CreateTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
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
  [key: string]: unknown;
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
}

export interface RecordTransactionItem {
  [key: string]: unknown;
  AdjustAmount?: number;
  AdjustAmountAft?: number;
  AdjustAmountBef?: number;
  AdminAccount?: string;
  OrderId?: string;
  ReviewNote?: string;
  TransferType?: number;
  UpdateTime?: number | string;
  WalletType?: number;
}

export interface NetcashListQuery {
  [key: string]: unknown;
  Page: number;
  PageSize: number;
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
  MaintainerName?: string;
  MainUsername?: string;
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
  [key: string]: unknown;
  Id?: number | string;
  IsMulti?: number;
  IsSettlement?: number;
  IsTeam?: number;
  ReportMonth?: string;
  Username?: string;
}

export type CommissionListResult = NetcashListResult<CommissionRow>;

export interface PlatformCreditInfo {
  [key: string]: unknown;
  Credit?: number;
  Dkcredit?: number;
  Items?: PlatformCreditInfo;
}

export interface PlatformCreditApplyRecord {
  [key: string]: unknown;
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
}

export interface PlatformNetCashLog {
  [key: string]: unknown;
  AdjustAmount?: number;
  AdjustAmountAft?: number;
  AdjustAmountBef?: number;
  OrderId?: number | string;
  ReviewNote?: string;
  UpdateTime?: number | string;
  WalletType?: number;
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
  [key: string]: unknown;
  ChannelId?: string;
  Id?: ChannelId;
  IsHidden?: number;
  Name?: string;
  PackageId?: string;
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
  [key: string]: unknown;
  Id?: ChannelId;
  LogoGroupId?: ChannelId;
  Name?: string;
  TemplateName?: string;
}

export interface LogoGroupListResult {
  [key: string]: unknown;
  Items?: LogoGroupOption[] | null;
  PackageLogo?: null | { LogoGroupId?: ChannelId };
}

export interface AgentDomainRow {
  [key: string]: unknown;
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
  [key: string]: unknown;
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
}

export interface BonusAdminItem {
  [key: string]: unknown;
  AdminId?: number | string;
  Amount?: number;
  Type?: number;
  Username?: string;
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
  [key: string]: unknown;
  GroupName?: string;
  Id: number | string;
  Level?: number;
  List?: ProxyGroupItem[];
  ParentId?: number | string;
  ParentTree?: string;
  Sort?: number;
}

export interface ProxyGroupingListItem {
  [key: string]: unknown;
  DeveloperName?: string;
  Group?: number | string;
  GroupCreateTime?: number | string;
  Id: number | string;
  Name?: string;
  Username?: string;
}
