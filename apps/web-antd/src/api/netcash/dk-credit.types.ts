import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

export type DkListQuery = NetcashListQuery;
export type DkListResult = NetcashListResult;

export interface DkCreditInfo {
  AppliableAmount?: number;
  Credit?: number;
  Items?: DkCreditInfo;
  TotalCreditLimit?: number;
  [key: string]: unknown;
}

export interface DkPlayerAvailableCredit {
  AvailableDeductAmount?: number;
  Gold?: number;
  LoginAccount?: string;
  PlayerId?: number | string;
  [key: string]: unknown;
}

export interface DkSharedOption {
  Label: string;
  Value?: number | string;
  Value2?: string;
  [key: string]: unknown;
}

export interface DkSharedConfig {
  BOAdminName?: DkSharedOption[];
  [key: string]: unknown;
}

export interface DkAdjustItem {
  Amount: number;
  PlayerId: number;
  PlayerWallet: number;
  ReferenceAccount: string;
  Remarks: string;
  WithdrawWaterMultiply: number;
}

export interface DkAdjustPayload {
  Hash: string;
  Items: string;
  PayPassword: string;
}

export interface DkApplyCreditPayload {
  AdjustAmount: number;
  AgentType: 3;
  ApplyNote: string;
  Hash: string;
  TransferType: 3;
  WalletType: 3;
}

export interface DkAccountPayload {
  AgentAccount: string;
  AgentNickName?: string;
  CreditDeduct?: number;
  Hash: string;
  Id?: number | string;
  TotalCreditLimit?: number;
}

export interface DkExcelPlayerQuery {
  LoginAccount: string;
  MultiAmount: string;
  PackageName: string;
}
