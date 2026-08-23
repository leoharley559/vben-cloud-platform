export interface BankCardListQuery {
  BankCardNum?: string;
  BeginTime?: number | string;
  EndTime?: number | string;
  LoginAccount?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
}

export interface BankCardListItem {
  [key: string]: unknown;
  AlipayAccount?: string;
  AlipayName?: string;
  BankCardNum?: string;
  BankCardTime?: number | string;
  BankCode?: string;
  BankRealName?: string;
  Id?: number | string;
  LoginAccount?: string;
  MerchantOrderNo?: string;
  PackageName?: string;
  PlayerId?: number | string;
  RealName?: string;
  ThirdPartyUserId?: string;
}

export interface BankCardFormPayload {
  AlipayAccount?: string;
  AlipayName?: string;
  BankCardNum?: string;
  BankCode?: string;
  BankRealName?: string;
  DeviceId?: string;
  Hash?: string;
  Id?: number | string;
  LoginAccount?: string;
  OperationType?: number;
  PackageName?: string;
  PlayerId?: number | string;
  ValidCode?: string;
}

export interface ResolvePlayerByAccountPayload {
  LoginAccount: string;
  PackageName: string;
}
