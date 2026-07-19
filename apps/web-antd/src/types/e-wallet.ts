export interface EWalletListQuery {
  AccountNum?: string;
  BeginTime?: number;
  EndTime?: number;
  LoginAccount?: string;
  Page: number;
  PageSize: number;
  PayType?: number | string;
}

export interface EWalletListItem {
  Account?: string;
  CreateTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  Name?: string;
  PackageId?: number | string;
  PackageName?: string;
  PayType?: number;
  PlayerId?: number | string;
  [key: string]: unknown;
}

export interface EWalletFormPayload {
  Account?: string;
  Hash?: string;
  Id?: number | string;
  LoginAccount?: string;
  Name?: string;
  PackageId?: number | string;
  PayType?: number | string;
  PlayerId?: number | string;
  ValidCode?: string;
}

export const E_WALLET_PAY_TYPES = [
  { label: 'GCash', value: 201 },
  { label: 'GrabPay', value: 202 },
  { label: 'PayMaya', value: 203 },
];

export function formatEWalletPayType(value?: number) {
  return E_WALLET_PAY_TYPES.find((item) => item.value === value)?.label || '-';
}
