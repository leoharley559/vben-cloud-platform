export interface MobileVerifyCodeListQuery {
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PhoneNum?: string;
  PlayerId?: string;
}

export interface MobileVerifyCodeListItem {
  [key: string]: unknown;
  CreateTime?: number | string;
  HandlerName?: string;
  LoginAccount?: string;
  PackageName?: string;
  PhoneNum?: string;
  PlayerId?: number | string;
  VerifyCode?: string;
}

export interface MobileVerifyWhitelistListQuery {
  Account?: string;
  ChannelId?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
}

export interface MobileVerifyWhitelistItem {
  [key: string]: unknown;
  Account?: string;
  ChannelId?: number | string;
  PackageName?: string;
  PlayerId?: number | string;
}

export interface MobileVerifyWhitelistPayload {
  Account: string;
  PackageId: number | string;
  PlayerId?: number | string;
}
