export interface AdminListQuery {
  BeginTime?: number | string;
  EndTime?: number | string;
  Keyword?: string;
  Page: number;
  PageSize: number;
  Sort?: string;
  Status?: string;
}

export interface AdminListItem {
  CreateTime?: string;
  CreateUsername?: string;
  HandlerUsername?: string;
  Id: number;
  LoginType?: number;
  Name?: string;
  Note?: string;
  Role?: string;
  Status?: number;
  Username?: string;
}

export interface AdminListResult {
  Items?: AdminListItem[];
  Pagination?: {
    MaxCount?: number;
    Page?: number;
    PageSize?: number;
  };
}

export interface CloudRoleOption {
  Id: number;
  Name: string;
}

export type AdminDialogMode =
  | 'create'
  | 'delete'
  | 'endUse'
  | 'startUse'
  | 'update';

export interface AdminSonUserRoleDataField {
  SeeAccountId: Array<number | string>;
  SeeChannelId: Array<number | string>;
  SeeDevices: Array<number | string>;
  SeePackageId: Array<number | string>;
  ViewOTP: string;
}

export interface AdminFormModel {
  ConfirmPassword?: string;
  ContactInf?: string;
  CreateRole: number[];
  Hash?: string;
  Id?: number;
  Name?: string;
  Note?: string;
  Password?: string;
  Role: number[];
  SonUserRoleDataField: AdminSonUserRoleDataField;
  Status?: number;
  Username?: string;
  ValidCode?: string;
}

export interface AdminDetailRecord extends AdminFormModel {
  CreateTime?: string;
  CreateUsername?: string;
  HandlerUsername?: string;
  LoginType?: number;
  SonUserRoleDataField: AdminSonUserRoleDataField | string;
}

export interface PackageOption {
  AdminId?: number | string;
  PackageId: number | string;
  PackageName: string;
}

export interface CloudSubMenuItem {
  HaveDesData?: number;
  Id: number;
  MenuId?: number;
  Name: string;
  ParentId?: number;
  [key: string]: unknown;
}

export interface RoleListQuery {
  Keyword?: string;
  Page: number;
  PageSize: number;
}

export interface RoleListItem {
  AdminId?: number;
  CreateAdminId?: number;
  Description?: string;
  Id: number;
  Name: string;
}

export interface RoleListResult {
  Items?: RoleListItem[];
  Pagination?: {
    MaxCount?: number;
  };
}

export interface RoleFormModel {
  AdminId?: number;
  CreateAdminId?: number;
  Description?: string;
  Id?: number;
  MenuIds?: number[] | string;
  Name: string;
  ParamIds?: number[] | string;
  SubMenuIds?: number[] | string;
}

export interface LogListQuery {
  BeginTime?: number | string;
  CreateAdminId?: number | string;
  EndTime?: number | string;
  IsExp?: boolean;
  Keyword?: string;
  LogTypeId?: number | string;
  Page: number;
  PageSize: number;
  Sort?: string;
}

export interface LogListItem {
  CreateTime?: number | string;
  Ip?: string;
  LogTemplate?: string;
  LogType?: string;
  Params?: Record<string, unknown> | string;
  TemplateId?: number;
  Username?: string;
}

export interface LogListResult {
  Items?: LogListItem[];
  Pagination?: {
    MaxCount?: number;
  };
}

export interface LogTypeOption {
  LogType: string;
  LogTypeId: number | string;
}

export interface LogUserOption {
  CreateAdminId: number | string;
  Username: string;
}

export interface SecuritySettingItem {
  HandlerName?: string;
  HandlerTime?: number | string;
  Id: number | string;
  IsOpen?: boolean;
  PageId: number | string;
  Type: number;
}
