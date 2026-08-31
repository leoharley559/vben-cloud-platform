export type BankCardResourceType = 'alipay' | 'bank_card' | 'wechat';

export interface BankCardListQuery {
  Account?: string;
  BankCardNum?: string;
  BeginTime?: number | string;
  EndTime?: number | string;
  LoginAccount?: string;
  Name?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  ResourceType: BankCardResourceType;
}

/** 支付宝 / 微信账号（接口 AlipayAccounts / WechatAccounts） */
export interface PlayerPayAccountItem {
  Account?: string;
  AccountType?: number;
  CreateTime?: number | string;
  HasQrCode?: boolean;
  Id?: number | string;
  IsDefault?: boolean;
  Name?: string;
  QrCodeUrl?: string;
}

export interface BankCardListItem {
  [key: string]: unknown;
  Account?: string;
  AlipayAccount?: string;
  AlipayName?: string;
  BankCardNum?: string;
  BankCardTime?: number | string;
  BankCode?: string;
  BankRealName?: string;
  Id?: number | string;
  LoginAccount?: string;
  MerchantOrderNo?: string;
  Name?: string;
  PackageName?: string;
  PlayerId?: number | string;
  QrCodeUrl?: string;
  RealName?: string;
  ThirdPartyUserId?: string;
  WechatAccount?: string;
  WechatName?: string;
}

export interface BankCardListResult {
  AlipayAccounts?: PlayerPayAccountItem[];
  Items?: BankCardListItem[];
  Pagination?: {
    CurrPage?: number;
    MaxCount?: number;
    MaxPageCount?: number;
    PageSize?: number;
  };
  WechatAccounts?: PlayerPayAccountItem[];
}

export interface BankCardFormPayload {
  Account?: string;
  AccountType?: number;
  AlipayAccount?: string;
  AlipayName?: string;
  BankCardNum?: string;
  BankCode?: string;
  BankRealName?: string;
  DeviceId?: string;
  Hash?: string;
  Id?: number | string;
  LoginAccount?: string;
  Name?: string;
  OperationType?: number;
  PackageName?: string;
  PlayerId?: number | string;
  ResourceType?: 'bank_card' | 'withdrawal_account';
  ValidCode?: string;
  WechatAccount?: string;
  WechatName?: string;
}

export interface ResolvePlayerByAccountPayload {
  LoginAccount: string;
  PackageName: string;
}

/** 删除玩家绑定支付资源（银行卡 / 提款账号） */
export interface DeletePlayerPayResourceParams {
  AccountType?: number;
  Id: number | string;
  IsBlack?: boolean | number;
  ResourceType: 'bank_card' | 'withdrawal_account';
  ValidCode?: string;
}
