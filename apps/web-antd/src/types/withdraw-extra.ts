export interface WithdrawWhiteItem {
  [key: string]: unknown;
  CreateTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Remark?: string;
  Username?: string;
}

export interface SendOrderManageItem {
  [key: string]: unknown;
  AdminId?: number | string;
  AdminName?: string;
  ConfigLabel?: string | string[];
  CountNum?: number | string;
  Id?: number | string;
  IsOnline?: number;
  MaxOrderNum?: number | string;
  Name?: string;
  Status?: number;
  Username?: string;
}

export interface WithdrawFinanceItem {
  [key: string]: unknown;
  AccountType?: number | string;
  AgentWithdrawId?: number | string;
  Amount?: number | string;
  CreateTime?: number | string;
  HandlerName?: string;
  Id?: number | string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Process?: number;
  RealName?: string;
  RiskStatus?: number;
  Status?: number;
}

export interface WithdrawOrderStatItem {
  [key: string]: unknown;
  ApplyAmount?: number | string;
  AvgTime?: number | string;
  Count?: number | string;
  FailCount?: number | string;
  FinanceTime?: number | string;
  FinishTime?: number | string;
  HighCount?: number | string;
  LowCount?: number | string;
  MiddleCount?: number | string;
  RefuseAmount?: number | string;
  RefuseCount?: number | string;
  ReportDay?: string;
  RiskAuditorTime?: number | string;
  WithdrawAmount?: number | string;
  WithdrawCount?: number | string;
}

export interface WithdrawRevertedItem {
  [key: string]: unknown;
  Amount?: number | string;
  CreateTime?: number | string;
  HandlerName?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Status?: number;
}

export interface WithdrawWaterItem {
  [key: string]: unknown;
  ChannelId?: number | string;
  CreateTime?: number | string;
  HandlerName?: string;
  Id?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Status?: number;
  TotalFlow?: number | string;
  TotalWinloss?: number | string;
  VipLevel?: number | string;
}

export interface WithdrawWaterStatusLogItem {
  [key: string]: unknown;
  CreateTime?: number | string;
  HandlerInf?: string;
  HandlerName?: string;
  Status?: number;
}

export interface WithdrawWaterFlowSettingItem {
  [key: string]: unknown;
  BalanceAmount?: number;
  Id?: number | string;
  NegativeProfitAmount?: number;
}

export interface SelfCheckActionRecord {
  [key: string]: unknown;
  CreateTime?: number | string;
  Id?: number | string;
  Remark?: string;
  ReviewName?: string;
  Status?: number;
}
