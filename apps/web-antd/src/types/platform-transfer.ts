export interface PlatformTransferItem {
  Amount?: number | string;
  ApproveName?: string;
  ApproveTime?: number | string;
  CreateTime?: number | string;
  GameId?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  OrderId?: string;
  State?: number;
  Type?: number;
  [key: string]: unknown;
}
