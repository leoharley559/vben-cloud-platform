export interface CardMultiBindListQuery {
  BankAccount?: string;
  BeginTime?: number;
  EndTime?: number;
  Page: number;
  PageSize: number;
}

export interface CardMultiBindListItem {
  BankCardNum?: string;
  Category?: number;
  CreateTime?: number | string;
  HandlerName?: string;
  Id?: number | string;
  PackageName?: string;
  [key: string]: unknown;
}

export interface CardMultiBindFormPayload {
  BankCardNum: string;
  Category: number;
  PackageId: number | string;
}

export const CARD_MULTI_BIND_CATEGORY_OPTIONS = [
  { label: '电子钱包', value: 1 },
  { label: '银行卡', value: 2 },
  { label: '虚拟币', value: 3 },
];

export function formatCardMultiBindCategory(value?: number) {
  return (
    CARD_MULTI_BIND_CATEGORY_OPTIONS.find((item) => item.value === value)
      ?.label || '-'
  );
}
