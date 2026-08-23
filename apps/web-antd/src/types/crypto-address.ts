export interface CryptoAddressListQuery {
  BeginTime?: number;
  DigitalAddress?: string;
  EndTime?: number;
  LoginAccount?: string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
}

export interface CryptoAddressListItem {
  [key: string]: unknown;
  CreateTime?: number | string;
  DigitalAddress?: string;
  DigitalAlias?: string;
  DigitalConfigType?: number;
  DigitalDesc?: string;
  DigitalType?: string;
  Id?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
}

export interface CryptoAddressFormPayload {
  DigitalAddress?: string;
  DigitalAlias?: string;
  DigitalConfigType?: number;
  DigitalDesc?: string;
  DigitalType?: string;
  Hash?: string;
  Id?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  ValidCode?: string;
}

export const CRYPTO_CONFIG_TYPE_OPTIONS = [
  { label: 'TRC20', value: 1 },
  { label: 'ERC20', value: 2 },
  { label: '其他', value: 3 },
];

export function formatCryptoConfigType(value?: number) {
  return (
    CRYPTO_CONFIG_TYPE_OPTIONS.find((item) => item.value === value)?.label ||
    '-'
  );
}
