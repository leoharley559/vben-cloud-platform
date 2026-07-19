export interface LoginLogListQuery {
  BeginTime: number;
  ChannelId?: number | string;
  DataSearchType?: number;
  EndTime: number;
  Ip?: string;
  LoginAccount?: string;
  LoginPlatform?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: string;
  Summary?: number;
}

export interface LoginLogSummaryQuery {
  BeginTime: number;
  DataSearchType?: number;
  EndTime: number;
  Summary: number;
}

export interface LoginLogSummaryData {
  Android?: number;
  AppStore?: number;
  H5?: number;
  Ios?: number;
  Other?: number;
  TotalPlatform?: number;
  TotalVip?: number;
  VipList?: number[];
  Web?: number;
  [key: string]: unknown;
}

export interface LoginLogListItem {
  ChannelId?: number | string;
  CreateTime?: number | string;
  DataFlag?: number;
  FromDomain?: string;
  Ip?: string;
  IpDetailName?: string;
  LoginAccount?: string;
  LoginPlatform?: string;
  PackageName?: string;
  PlayerId?: number | string;
  [key: string]: unknown;
}
