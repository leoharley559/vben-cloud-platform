export interface FundFlowListQuery {
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  LogId?: string;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  Reason?: Array<number | string> | number | string;
  Sort?: string;
}

export interface FundFlowListItem {
  [key: string]: unknown;
  AddGold?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
  ExInfo?: Record<string, unknown>;
  LangEn?: string;
  LangTw?: string;
  LangZh?: string;
  LogId?: string;
  LoginAccount?: string;
  NewGold?: number | string;
  OldGold?: number | string;
  PackageName?: string;
  PlayerId?: number | string;
  Reason?: number | string;
  Username?: string;
}

export interface FundFlowSummary {
  SumAddGold?: number | string;
}
