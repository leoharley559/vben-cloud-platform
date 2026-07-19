export interface WithdrawWhiteItem {
  CreateTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Remark?: string;
  Username?: string;
  [key: string]: unknown;
}

export interface SendOrderManageItem {
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
  [key: string]: unknown;
}

export interface WithdrawFinanceItem {
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
  [key: string]: unknown;
}

export interface WithdrawOrderStatItem {
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
  [key: string]: unknown;
}

export interface WithdrawRevertedItem {
  Amount?: number | string;
  CreateTime?: number | string;
  HandlerName?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Status?: number;
  [key: string]: unknown;
}

export interface WithdrawWaterItem {
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
  [key: string]: unknown;
}

export interface WithdrawWaterStatusLogItem {
  CreateTime?: number | string;
  HandlerInf?: string;
  HandlerName?: string;
  Status?: number;
  [key: string]: unknown;
}

export interface WithdrawWaterFlowSettingItem {
  BalanceAmount?: number;
  Id?: number | string;
  NegativeProfitAmount?: number;
  [key: string]: unknown;
}

export interface SelfCheckActionRecord {
  CreateTime?: number | string;
  Id?: number | string;
  Remark?: string;
  ReviewName?: string;
  Status?: number;
  [key: string]: unknown;
}
