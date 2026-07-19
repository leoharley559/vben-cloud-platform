export interface FundFlowListQuery {
  BeginTime?: number;
  DataSearchType?: number;
  EndTime?: number;
  LogId?: string;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  Reason?: Array<number | string> | number | string;
  Sort?: string;
}

export interface FundFlowListItem {
  AddGold?: number | string;
  ChannelName?: string;
  CreateTime?: number | string;
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
  ExInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FundFlowSummary {
  SumAddGold?: number | string;
}
