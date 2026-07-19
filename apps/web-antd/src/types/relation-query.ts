export interface RelationQueryItem {
  ChannelId?: number | string;
  DeviceId?: string;
  InviterLoginAccount?: number | string;
  IsAgent?: number;
  LoginAccount?: string;
  LoginAddress?: string;
  LoginIp?: string;
  LoginPlatform?: string;
  LoginTime?: number | string;
  PackageName?: string;
  [key: string]: unknown;
}

export interface RelationQueryTotal {
  DeviceIdCount?: number | string;
  IpCount?: number | string;
  PlayerCount?: number | string;
}

export interface RelationQueryListQuery {
  BeginTime?: number | string;
  ChannelIds?: Array<number | string> | number | string;
  ChannelSearch?: Array<number | string> | number | string;
  ChannelSearchType?: number;
  DeviceId?: string;
  EndTime?: number | string;
  InviterLoginAccount?: string;
  LoginAccount?: string;
  LoginAddress?: string;
  LoginIp?: string;
  LoginPlatform?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  PlayerName?: string;
}
