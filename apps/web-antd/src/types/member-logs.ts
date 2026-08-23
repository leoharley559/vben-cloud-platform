export interface LoginLogListQuery {
  BeginTime: number | string;
  ChannelId?: number | string;
  DataSearchType?: number;
  EndTime: number | string;
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
  BeginTime: number | string;
  DataSearchType?: number;
  EndTime: number | string;
  Summary: number;
}

export interface LoginLogSummaryData {
  [key: string]: unknown;
  Android?: number;
  AppStore?: number;
  H5?: number;
  Ios?: number;
  Other?: number;
  TotalPlatform?: number;
  TotalVip?: number;
  VipList?: number[];
  Web?: number;
}

export interface LoginLogListItem {
  [key: string]: unknown;
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
}
