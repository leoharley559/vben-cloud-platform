export interface PhoneAreaCodeListQuery {
  CountryName?: string;
  DialingCode?: string;
  Page: number;
  PageSize: number;
}

export interface PhoneAreaCodeListItem {
  [key: string]: unknown;
  CountryName?: string;
  CountryNameEn?: string;
  CountryNameZhTw?: string;
  DialingCode?: string;
  FrequentlyUsed?: number;
  Id?: number | string;
  Key?: string;
  Status?: number;
  UpdateBy?: string;
  UpdateTime?: number | string;
}

export interface PhoneAreaCodeSwitchPayload {
  FrequentlyUsed?: number;
  Key: string;
  Status?: number;
}

export interface PhoneAreaCodeSortPayload {
  Id1: number | string;
  Id2: number | string;
}
