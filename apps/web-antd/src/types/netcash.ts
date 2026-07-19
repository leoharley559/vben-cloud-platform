import type { CloudPagination } from '#/types/operation-manage';

export interface AgencyListItem {
  AccountLevel?: number;
  AccountType?: number;
  CommissionTemplateId?: number;
  CreateTime?: number | string;
  DeveloperName?: string;
  Id?: number | string;
  MaintainerName?: string;
  MobileNumber?: string;
  Name?: string;
  Remark?: string;
  Status?: number;
  TeamName?: string;
  Type?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface AgencyListQuery {
  DeveloperName?: string;
  LastLoginDevice?: string;
  LastLoginIP?: string;
  MaintainerName?: string;
  MobileNumber?: string;
  Page: number;
  PageSize: number;
  RegistDevice?: string;
  RegistIP?: string;
  Sort?: string;
  Status?: number | string;
  TeamName?: string;
  Type?: number | string;
  Username?: string;
  WithdrawAccName?: string;
  WithdrawAccNum?: string;
}

export interface AgencyRegisterItem {
  CreateTime?: number | string;
  DeveloperName?: string;
  Email?: string;
  Id?: number | string;
  MobileNumber?: string;
  RegisterDevice?: string;
  RegisterIP?: string;
  Status?: number;
  Username?: string;
  [key: string]: unknown;
}

export interface AgencyRegisterListQuery {
  Page: number;
  PageSize: number;
  Status?: number | string;
  Username?: string;
}

export interface SpillManageItem {
  Account?: string;
  ApproveName?: string;
  ApproveTime?: number | string;
  CreateTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  OwnerAccount?: string;
  OwnerChannelId?: number | string;
  PackageName?: string;
  RealPlatform?: string;
  RegisterTime?: number | string;
  Status?: number;
  Url?: string;
  VipLevel?: number | string;
  [key: string]: unknown;
}

export interface SpillManageListQuery {
  Account?: string;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: number | string;
  Status?: number | string;
  TimeBegin?: number | string;
  TimeEnd?: number | string;
  VipLevel?: number | string;
}

export interface HelpCenterItem {
  Content?: string;
  Id?: number | string;
  LangGroupId?: number | string;
  Sort?: number;
  Tag?: string;
}

export interface HelpCenterListQuery {
  LangGroupId?: number | string;
}

export interface RecordQueryBaseQuery {
  AgentAccount?: string;
  BeginTime?: number | string;
  DataSearchType?: number;
  EndTime?: number | string;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface RecordQueryListResult<T> {
  Items?: T[];
  Pagination?: CloudPagination;
  Total?: Record<string, number>;
}

export interface RecordDepositItem {
  AgentAccount?: string;
  CreateTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  RealAmount?: number;
  [key: string]: unknown;
}

export interface RecordLoginItem {
  AgentAccount?: string;
  CreateTime?: number | string;
  LoginAccount?: string;
  LoginIP?: string;
  PackageName?: string;
  [key: string]: unknown;
}

export interface NetcashListQuery {
  Page: number;
  PageSize: number;
  [key: string]: unknown;
}

export interface NetcashListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: CloudPagination;
  Total?: Record<string, number>;
}
